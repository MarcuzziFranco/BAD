using BAD.API.DTOs;
using BAD.API.Services;
using BAD.Core.Flow;
using BAD.Storage.Context;
using BAD.Storage.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BAD.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FlowRunsController : ControllerBase
{
    private readonly BadDbContext _db;
    private readonly IServiceScopeFactory _scopeFactory;

    public FlowRunsController(BadDbContext db, IServiceScopeFactory scopeFactory)
    {
        _db = db;
        _scopeFactory = scopeFactory;
    }

    /// <summary>Inicia una corrida de flujo (DAG).</summary>
    [HttpPost("~/api/flows/{flowId:int}/runs")]
    public async Task<ActionResult<FlowRunDto>> StartFromFlow(int flowId, [FromBody] StartFlowRunDto? dto)
    {
        var flow = await _db.ExecutionFlows.AsNoTracking().FirstOrDefaultAsync(f => f.Id == flowId);
        if (flow == null)
            return NotFound();

        FlowDefinitionV1 def;
        try
        {
            def = FlowDefinitionParser.Parse(flow.DefinitionJson);
            var errs = FlowDagValidation.Validate(def);
            if (errs.Count > 0)
                return BadRequest(string.Join("; ", errs));
            FlowDagValidation.TopologicalOrder(def);
        }
        catch (FlowDefinitionException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        var requestCount = dto?.RequestCount ?? 1;
        if (requestCount < 1 || requestCount > 10_000)
            return BadRequest("requestCount debe estar entre 1 y 10000.");

        var run = new FlowRun
        {
            ExecutionFlowId = flowId,
            Status = "pending",
            RequestCount = requestCount,
            ExecutionMode = string.IsNullOrWhiteSpace(dto?.ExecutionMode) ? "sequential" : dto!.ExecutionMode!,
            IntervalMs = dto?.IntervalMs ?? 0,
            MutatePerIteration = dto?.MutatePerIteration ?? true,
            StartedAt = DateTime.UtcNow
        };

        foreach (var n in def.Nodes)
        {
            run.Steps.Add(new FlowRunStep
            {
                ClientNodeId = n.Id,
                Status = "pending"
            });
        }

        _db.FlowRuns.Add(run);
        await _db.SaveChangesAsync();

        FlowRunProcessor.StartBackground(run.Id, _scopeFactory);

        return Ok(ToDto(run));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<FlowRunDetailDto>> GetById(int id)
    {
        var run = await _db.FlowRuns
            .AsNoTracking()
            .Include(r => r.ExecutionFlow)
            .Include(r => r.Steps)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (run == null || run.ExecutionFlow == null)
            return NotFound();

        return Ok(new FlowRunDetailDto(
            run.Id,
            run.ExecutionFlowId,
            run.ExecutionFlow.Name,
            run.Status,
            run.RequestCount,
            run.ExecutionMode,
            run.IntervalMs,
            run.MutatePerIteration,
            run.Error,
            run.StartedAt,
            run.FinishedAt,
            run.ExecutionFlow.DefinitionJson,
            run.Steps.OrderBy(s => s.Id).Select(s => new FlowRunStepDto(
                s.Id,
                s.ClientNodeId,
                s.Status,
                s.TestExecutionId,
                s.Error,
                s.StartedAt,
                s.FinishedAt)).ToList()));
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var run = await _db.FlowRuns.Include(r => r.Steps).FirstOrDefaultAsync(r => r.Id == id);
        if (run == null)
            return NotFound();

        FlowRunProcessor.CancelRun(id);

        if (run.Status is "pending" or "running")
        {
            run.Status = "cancelled";
            run.FinishedAt = DateTime.UtcNow;
            foreach (var s in run.Steps.Where(s => s.Status is "pending" or "running"))
            {
                s.Status = s.Status == "running" ? "cancelled" : "skipped";
                s.FinishedAt = DateTime.UtcNow;
            }
            await _db.SaveChangesAsync();
        }

        return Ok(new { message = "Corrida cancelada" });
    }

    private static FlowRunDto ToDto(FlowRun r) =>
        new(
            r.Id,
            r.ExecutionFlowId,
            r.Status,
            r.RequestCount,
            r.ExecutionMode,
            r.IntervalMs,
            r.MutatePerIteration,
            r.Error,
            r.StartedAt,
            r.FinishedAt);
}
