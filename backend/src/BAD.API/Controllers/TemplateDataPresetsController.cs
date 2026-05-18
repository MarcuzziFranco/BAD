using BAD.API.DTOs;
using BAD.Storage.Context;
using BAD.Storage.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace BAD.API.Controllers;

[ApiController]
[Route("api/json-templates/{templateId:int}/data-presets")]
public class TemplateDataPresetsController : ControllerBase
{
    private readonly BadDbContext _context;

    public TemplateDataPresetsController(BadDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DataPresetSummaryDto>>> List(int templateId)
    {
        if (!await _context.JsonTemplates.AnyAsync(t => t.Id == templateId))
            return NotFound("Template no encontrado");

        var items = await _context.GeneratorSettings
            .AsNoTracking()
            .Where(g => g.JsonTemplateId == templateId)
            .OrderBy(g => g.Name)
            .Select(g => new DataPresetSummaryDto(
                g.Id,
                g.Name,
                g.Description,
                g.CreatedAt,
                g.UpdatedAt))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DataPresetDetailDto>> GetById(int templateId, int id)
    {
        var gs = await _context.GeneratorSettings.AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == id && g.JsonTemplateId == templateId);

        if (gs == null)
            return NotFound();

        var fields = ParseConfigurations(gs.FieldConfigurations);
        if (fields == null)
            return BadRequest("FieldConfigurations no es un JSON válido");

        return Ok(new DataPresetDetailDto(
            gs.Id,
            gs.Name,
            gs.Description,
            fields,
            gs.CreatedAt,
            gs.UpdatedAt));
    }

    [HttpPost]
    public async Task<ActionResult<DataPresetDetailDto>> Create(int templateId, [FromBody] CreateDataPresetDto dto)
    {
        if (!await _context.JsonTemplates.AnyAsync(t => t.Id == templateId))
            return NotFound("Template no encontrado");

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("El nombre es obligatorio");

        var fields = ValidateConfigurationsJson(dto.FieldConfigurationsJson);
        if (fields == null)
            return BadRequest("FieldConfigurationsJson debe ser un array JSON de configuraciones de campo");

        var now = DateTime.UtcNow;
        var entity = new GeneratorSetting
        {
            Name = dto.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
            JsonTemplateId = templateId,
            FieldConfigurations = JsonConvert.SerializeObject(fields),
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.GeneratorSettings.Add(entity);
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict("Ya existe un preset de datos con ese nombre para este template");
        }

        return CreatedAtAction(nameof(GetById), new { templateId, id = entity.Id },
            new DataPresetDetailDto(
                entity.Id,
                entity.Name,
                entity.Description,
                fields,
                entity.CreatedAt,
                entity.UpdatedAt));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int templateId, int id, [FromBody] UpdateDataPresetDto dto)
    {
        var entity = await _context.GeneratorSettings
            .FirstOrDefaultAsync(g => g.Id == id && g.JsonTemplateId == templateId);

        if (entity == null)
            return NotFound();

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("El nombre es obligatorio");

        var fields = ValidateConfigurationsJson(dto.FieldConfigurationsJson);
        if (fields == null)
            return BadRequest("FieldConfigurationsJson debe ser un array JSON de configuraciones de campo");

        entity.Name = dto.Name.Trim();
        entity.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
        entity.FieldConfigurations = JsonConvert.SerializeObject(fields);
        entity.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict("Ya existe un preset de datos con ese nombre para este template");
        }

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int templateId, int id)
    {
        var entity = await _context.GeneratorSettings
            .FirstOrDefaultAsync(g => g.Id == id && g.JsonTemplateId == templateId);

        if (entity == null)
            return NotFound();

        _context.GeneratorSettings.Remove(entity);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static List<FieldConfigDto>? ValidateConfigurationsJson(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new List<FieldConfigDto>();
        try
        {
            var list = JsonConvert.DeserializeObject<List<FieldConfigDto>>(json);
            return list ?? new List<FieldConfigDto>();
        }
        catch
        {
            return null;
        }
    }

    private static List<FieldConfigDto>? ParseConfigurations(string json)
    {
        try
        {
            return JsonConvert.DeserializeObject<List<FieldConfigDto>>(json) ?? new List<FieldConfigDto>();
        }
        catch
        {
            return null;
        }
    }
}
