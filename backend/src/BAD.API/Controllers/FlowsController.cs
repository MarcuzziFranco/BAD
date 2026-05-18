using BAD.API.DTOs;
using BAD.API.Services;
using BAD.Core.Flow;
using BAD.Storage.Context;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace BAD.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FlowsController : ControllerBase
{
    private readonly BadDbContext _db;

    public FlowsController(BadDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExecutionFlowDto>>> GetAll()
    {
        var list = await _db.ExecutionFlows.AsNoTracking()
            .OrderByDescending(f => f.UpdatedAt)
            .Select(f => new ExecutionFlowDto(
                f.Id,
                f.Name,
                f.Description,
                f.DefinitionVersion,
                f.CreatedAt,
                f.UpdatedAt))
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ExecutionFlowDetailDto>> GetById(int id)
    {
        var f = await _db.ExecutionFlows.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (f == null)
            return NotFound();

        return Ok(new ExecutionFlowDetailDto(
            f.Id,
            f.Name,
            f.Description,
            f.DefinitionVersion,
            f.DefinitionJson,
            f.CreatedAt,
            f.UpdatedAt));
    }

    [HttpPost]
    public async Task<ActionResult<ExecutionFlowDto>> Create([FromBody] CreateExecutionFlowDto dto)
    {
        try
        {
            var def = FlowDefinitionParser.Parse(dto.DefinitionJson);
            var errs = FlowDagValidation.Validate(def);
            if (errs.Count > 0)
                return BadRequest(string.Join("; ", errs));
            FlowDagValidation.TopologicalOrder(def);
        }
        catch (FlowDefinitionException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        var now = DateTime.UtcNow;
        var entity = new BAD.Storage.Entities.ExecutionFlow
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            DefinitionVersion = 1,
            DefinitionJson = dto.DefinitionJson,
            CreatedAt = now,
            UpdatedAt = now
        };
        _db.ExecutionFlows.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(new ExecutionFlowDto(
            entity.Id,
            entity.Name,
            entity.Description,
            entity.DefinitionVersion,
            entity.CreatedAt,
            entity.UpdatedAt));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ExecutionFlowDto>> Update(int id, [FromBody] UpdateExecutionFlowDto dto)
    {
        var entity = await _db.ExecutionFlows.FirstOrDefaultAsync(f => f.Id == id);
        if (entity == null)
            return NotFound();

        try
        {
            var def = FlowDefinitionParser.Parse(dto.DefinitionJson);
            var errs = FlowDagValidation.Validate(def);
            if (errs.Count > 0)
                return BadRequest(string.Join("; ", errs));
            FlowDagValidation.TopologicalOrder(def);
        }
        catch (FlowDefinitionException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        entity.Name = dto.Name.Trim();
        entity.Description = dto.Description?.Trim();
        entity.DefinitionJson = dto.DefinitionJson;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new ExecutionFlowDto(
            entity.Id,
            entity.Name,
            entity.Description,
            entity.DefinitionVersion,
            entity.CreatedAt,
            entity.UpdatedAt));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.ExecutionFlows.FirstOrDefaultAsync(f => f.Id == id);
        if (entity == null)
            return NotFound();
        _db.ExecutionFlows.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:int}/runs")]
    public async Task<ActionResult<IEnumerable<FlowRunDto>>> ListRuns(int id, [FromQuery] int take = 5)
    {
        var exists = await _db.ExecutionFlows.AsNoTracking().AnyAsync(f => f.Id == id);
        if (!exists)
            return NotFound();

        var runs = await _db.FlowRuns.AsNoTracking()
            .Where(r => r.ExecutionFlowId == id)
            .OrderByDescending(r => r.StartedAt)
            .Take(Math.Clamp(take, 1, 50))
            .Select(r => new FlowRunDto(
                r.Id,
                r.ExecutionFlowId,
                r.Status,
                r.RequestCount,
                r.ExecutionMode,
                r.IntervalMs,
                r.MutatePerIteration,
                r.Error,
                r.StartedAt,
                r.FinishedAt))
            .ToListAsync();

        return Ok(runs);
    }

    [HttpPost("preview-merge")]
    public async Task<ActionResult<FlowPreviewMergeResponseDto>> PreviewMerge(
        [FromBody] FlowPreviewMergeRequestDto dto,
        CancellationToken ct)
    {
        try
        {
            var step = MapStep(dto.Step);
            var merged = await FlowPreviewService.PreviewMergeAsync(_db, step, dto.ParentBodies, ct);
            return Ok(new FlowPreviewMergeResponseDto(merged));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("probe-step")]
    public async Task<ActionResult<FlowProbeStepResponseDto>> ProbeStep(
        [FromBody] FlowPreviewMergeRequestDto dto,
        CancellationToken ct)
    {
        try
        {
            var step = MapStep(dto.Step);
            var result = await FlowPreviewService.ProbeStepAsync(_db, step, dto.ParentBodies, ct);
            return Ok(new FlowProbeStepResponseDto(
                result.RequestPayload,
                result.ResponseBody,
                result.StatusCode,
                result.IsSuccess,
                result.Error,
                result.MergedJson));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private static FlowStepV1 MapStep(FlowStepPreviewRequestDto dto)
    {
        var json = JsonConvert.SerializeObject(new
        {
            requestConfigId = dto.RequestConfigId,
            bodyMode = dto.BodyMode,
            baseJson = dto.BaseJson,
            templateId = dto.TemplateId,
            mutations = dto.Mutations?.Select(m => new
            {
                key = m.Key,
                operation = m.Operation,
                value = m.Value,
                minValue = m.MinValue,
                maxValue = m.MaxValue,
                listValues = m.ListValues
            }),
            presetName = dto.PresetName,
            dataPresetId = dto.DataPresetId,
            mutatePerIteration = dto.MutatePerIteration,
            inputMappings = (dto.InputMappings ?? new List<FlowInputMappingPreviewDto>()).Select(m => new
            {
                fromNodeId = m.FromNodeId,
                sourcePath = m.SourcePath,
                targetPath = m.TargetPath
            })
        });
        return JsonConvert.DeserializeObject<FlowStepV1>(json)
               ?? throw new FlowDefinitionException("Paso inválido.");
    }
}
