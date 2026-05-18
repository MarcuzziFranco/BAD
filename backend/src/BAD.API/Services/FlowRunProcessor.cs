using System.Collections.Concurrent;
using BAD.Core.Flow;
using BAD.Core.Models;
using BAD.Core.Services;
using BAD.Storage.Context;
using BAD.Storage.Entities;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BAD.API.Services;

public static class FlowRunProcessor
{
    private static readonly ConcurrentDictionary<int, CancellationTokenSource> ActiveRuns = new();

    public static void CancelRun(int flowRunId)
    {
        if (ActiveRuns.TryRemove(flowRunId, out var cts))
            cts.Cancel();
    }

    public static void StartBackground(int flowRunId, IServiceScopeFactory scopeFactory)
    {
        var cts = new CancellationTokenSource();
        ActiveRuns[flowRunId] = cts;
        _ = Task.Run(() => RunAsync(flowRunId, scopeFactory, cts.Token), CancellationToken.None);
    }

    private static async Task RunAsync(int flowRunId, IServiceScopeFactory scopeFactory, CancellationToken ct)
    {
        try
        {
            await RunCoreAsync(flowRunId, scopeFactory, ct);
        }
        finally
        {
            ActiveRuns.TryRemove(flowRunId, out _);
        }
    }

    private static async Task RunCoreAsync(int flowRunId, IServiceScopeFactory scopeFactory, CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BadDbContext>();

        var run = await db.FlowRuns
            .Include(r => r.ExecutionFlow)
            .Include(r => r.Steps)
            .FirstOrDefaultAsync(r => r.Id == flowRunId, ct);

        if (run == null || run.ExecutionFlow == null)
            return;

        var def = FlowDefinitionParser.Parse(run.ExecutionFlow.DefinitionJson);
        var order = FlowDagValidation.TopologicalOrder(def);
        var nodeById = def.Nodes.ToDictionary(n => n.Id, StringComparer.Ordinal);
        var parentsMap = FlowDagValidation.BuildParents(def);

        run.Status = "running";
        await db.SaveChangesAsync(ct);

        var bodies = new Dictionary<string, List<JObject?>>(StringComparer.Ordinal);
        foreach (var n in def.Nodes)
            bodies[n.Id] = new List<JObject?>(new JObject?[run.RequestCount]);

        foreach (var nodeId in order)
        {
            ct.ThrowIfCancellationRequested();
            if (!nodeById.TryGetValue(nodeId, out var flowNode))
                continue;

            var stepRow = run.Steps.FirstOrDefault(s => s.ClientNodeId == nodeId);
            if (stepRow == null)
                continue;

            if (stepRow.Status is "skipped" or "failed")
                continue;

            stepRow.Status = "running";
            stepRow.StartedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);

            using var execService = new ExecutionService();
            try
            {
                var rc = await db.RequestConfigs.FirstOrDefaultAsync(r => r.Id == flowNode.Step.RequestConfigId, ct);
                if (rc == null)
                    throw new InvalidOperationException($"RequestConfig {flowNode.Step.RequestConfigId} no encontrado.");

                var resolved = await FlowStepResolution.ResolveAsync(db, flowNode.Step, ct);
                var parents = parentsMap[nodeId];
                var mergedBases = new List<string>(run.RequestCount);

                for (var i = 0; i < run.RequestCount; i++)
                {
                    ct.ThrowIfCancellationRequested();
                    var parentDict = new Dictionary<string, JObject?>(StringComparer.Ordinal);
                    foreach (var p in parents)
                        parentDict[p] = bodies[p][i];

                    var merged = FlowResponseMapper.BuildMergedBase(
                        resolved.BaseJson,
                        parentDict,
                        flowNode.Step.InputMappings);
                    mergedBases.Add(merged.ToString(Formatting.None));
                }

                var testExec = new TestExecution
                {
                    RequestConfigId = rc.Id,
                    Status = "running",
                    ExecutionMode = run.ExecutionMode,
                    BodyMode = resolved.BodyMode,
                    BaseJson = mergedBases.Count > 0 ? mergedBases[0] : resolved.BaseJson,
                    MutationsConfig = resolved.EffectiveMutations is { Count: > 0 }
                        ? JsonConvert.SerializeObject(resolved.EffectiveMutations)
                        : null,
                    TemplateId = resolved.TemplateId,
                    IntervalMs = run.IntervalMs,
                    MutatePerIteration = run.MutatePerIteration,
                    PresetUsed = resolved.PresetUsedLabel is null
                        ? $"flow-node:{flowRunId}:{nodeId}"
                        : $"{resolved.PresetUsedLabel};flow-node:{flowRunId}:{nodeId}",
                    TotalRequests = run.RequestCount,
                    ExecutedAt = DateTime.UtcNow
                };

                db.TestExecutions.Add(testExec);
                await db.SaveChangesAsync(ct);

                stepRow.TestExecutionId = testExec.Id;
                await db.SaveChangesAsync(ct);

                var config = FlowStepResolution.BuildExecutionConfig(
                    resolved,
                    rc,
                    run.RequestCount,
                    run.ExecutionMode,
                    run.IntervalMs,
                    testExec.Id);

                var payloads = execService.GeneratePayloadsWithVariableBases(config, mergedBases);
                var results = await execService.ExecutePrecomputedPayloadsAsync(config, payloads);

                foreach (var r in results)
                {
                    db.TestResults.Add(new TestResult
                    {
                        TestExecutionId = testExec.Id,
                        Index = r.Index,
                        RequestPayload = r.RequestPayload,
                        ResponseBody = r.ResponseBody,
                        StatusCode = (int)r.StatusCode,
                        DurationMs = r.Duration.TotalMilliseconds,
                        Error = r.Error,
                        IsSuccess = r.IsSuccess,
                        ExecutedAt = r.ExecutedAt
                    });
                }

                for (var i = 0; i < results.Count && i < run.RequestCount; i++)
                    bodies[nodeId][i] = FlowResponseMapper.ParseResponseBody(results[i].ResponseBody);

                var anyFail = results.Any(r => !r.IsSuccess);
                stepRow.Status = anyFail ? "failed" : "completed";
                stepRow.FinishedAt = DateTime.UtcNow;
                stepRow.Error = anyFail
                    ? string.Join("; ", results.Where(r => !r.IsSuccess).Select(r => r.Error ?? $"HTTP {r.StatusCode}"))
                    : null;

                var execEntity = await db.TestExecutions.FirstAsync(e => e.Id == testExec.Id, ct);
                execEntity.Status = anyFail ? "failed" : "completed";
                execEntity.FinishedAt = DateTime.UtcNow;
                execEntity.SuccessCount = results.Count(r => r.IsSuccess);
                execEntity.FailureCount = results.Count(r => !r.IsSuccess);
                if (results.Any())
                {
                    execEntity.AvgResponseTimeMs = results.Average(r => r.Duration.TotalMilliseconds);
                    execEntity.MinResponseTimeMs = results.Min(r => r.Duration.TotalMilliseconds);
                    execEntity.MaxResponseTimeMs = results.Max(r => r.Duration.TotalMilliseconds);
                }

                await db.SaveChangesAsync(ct);

                if (anyFail)
                {
                    MarkDescendantsSkipped(db, def, nodeId, run);
                    run.Status = "failed";
                    run.Error = stepRow.Error;
                    run.FinishedAt = DateTime.UtcNow;
                    await db.SaveChangesAsync(ct);
                    return;
                }
            }
            catch (OperationCanceledException)
            {
                stepRow.Status = "cancelled";
                stepRow.FinishedAt = DateTime.UtcNow;
                run.Status = "cancelled";
                run.FinishedAt = DateTime.UtcNow;
                await db.SaveChangesAsync(ct);
                MarkDescendantsSkipped(db, def, nodeId, run);
                await db.SaveChangesAsync(ct);
                return;
            }
            catch (Exception ex)
            {
                stepRow.Status = "failed";
                stepRow.Error = ex.Message;
                stepRow.FinishedAt = DateTime.UtcNow;
                run.Status = "failed";
                run.Error = ex.Message;
                run.FinishedAt = DateTime.UtcNow;
                await db.SaveChangesAsync(ct);
                MarkDescendantsSkipped(db, def, nodeId, run);
                return;
            }
        }

        run.Status = "completed";
        run.FinishedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private static void MarkDescendantsSkipped(BadDbContext db, FlowDefinitionV1 def, string failedNodeId, FlowRun run)
    {
        var childrenMap = FlowDagValidation.BuildChildren(def);
        var skip = new HashSet<string>(StringComparer.Ordinal);
        var stack = new Stack<string>(childrenMap[failedNodeId]);
        while (stack.Count > 0)
        {
            var u = stack.Pop();
            if (!skip.Add(u))
                continue;
            foreach (var v in childrenMap[u])
                stack.Push(v);
        }

        foreach (var step in run.Steps.Where(s => skip.Contains(s.ClientNodeId) && s.Status == "pending"))
        {
            step.Status = "skipped";
            step.FinishedAt = DateTime.UtcNow;
        }
    }
}
