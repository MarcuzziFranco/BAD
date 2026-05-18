using BAD.Core.Flow;
using BAD.Core.Models;
using BAD.Core.Services;
using BAD.Storage.Context;
using BAD.Storage.Entities;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BAD.API.Services;

public static class FlowPreviewService
{
    public static async Task<string> PreviewMergeAsync(
        BadDbContext db,
        FlowStepV1 step,
        IReadOnlyDictionary<string, string>? parentBodies,
        CancellationToken ct = default)
    {
        var resolved = await FlowStepResolution.ResolveAsync(db, step, ct);
        var parentDict = ParseParentBodies(parentBodies);
        var merged = FlowResponseMapper.BuildMergedBase(
            resolved.BaseJson,
            parentDict,
            step.InputMappings);
        return merged.ToString(Formatting.Indented);
    }

    public static async Task<FlowProbeStepResult> ProbeStepAsync(
        BadDbContext db,
        FlowStepV1 step,
        IReadOnlyDictionary<string, string>? parentBodies,
        CancellationToken ct = default)
    {
        var rc = await db.RequestConfigs.AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == step.RequestConfigId, ct);
        if (rc == null)
            throw new InvalidOperationException($"RequestConfig {step.RequestConfigId} no encontrado.");

        var resolved = await FlowStepResolution.ResolveAsync(db, step, ct);
        var parentDict = ParseParentBodies(parentBodies);
        var merged = FlowResponseMapper.BuildMergedBase(
            resolved.BaseJson,
            parentDict,
            step.InputMappings);
        var mergedJson = merged.ToString(Formatting.None);

        using var execService = new ExecutionService();
        var config = FlowStepResolution.BuildExecutionConfig(
            resolved with { BaseJson = mergedJson },
            rc,
            requestCount: 1,
            executionMode: "sequential",
            intervalMs: 0,
            executionId: 0);

        var payloads = execService.GeneratePayloadsWithVariableBases(config, new[] { mergedJson });
        var results = await execService.ExecutePrecomputedPayloadsAsync(config, payloads);

        var first = results.FirstOrDefault();
        if (first == null)
            throw new InvalidOperationException("No se obtuvo resultado del probe.");

        return new FlowProbeStepResult(
            first.RequestPayload,
            first.ResponseBody,
            (int)first.StatusCode,
            first.IsSuccess,
            first.Error,
            mergedJson);
    }

    private static Dictionary<string, JObject?> ParseParentBodies(IReadOnlyDictionary<string, string>? parentBodies)
    {
        var dict = new Dictionary<string, JObject?>(StringComparer.Ordinal);
        if (parentBodies == null)
            return dict;

        foreach (var (nodeId, json) in parentBodies)
            dict[nodeId] = FlowResponseMapper.ParseResponseBody(json);

        return dict;
    }
}

public record FlowProbeStepResult(
    string RequestPayload,
    string ResponseBody,
    int StatusCode,
    bool IsSuccess,
    string? Error,
    string MergedJson);
