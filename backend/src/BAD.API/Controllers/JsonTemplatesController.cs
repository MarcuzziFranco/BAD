using BAD.API.DTOs;
using BAD.Storage.Context;
using BAD.Storage.Entities;
using ResourceGroups = BAD.Storage.Entities.ResourceGroups;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BAD.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JsonTemplatesController : ControllerBase
{
    private readonly BadDbContext _context;

    public JsonTemplatesController(BadDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<JsonTemplateDto>>> GetAll()
    {
        var rows = await _context.JsonTemplates
            .OrderByDescending(t => t.UpdatedAt)
            .ToListAsync();

        var linked = await _context.RequestConfigs
            .Where(c => c.JsonTemplateId != null)
            .Select(c => new { c.JsonTemplateId, c.Id, c.Name, c.Method, c.Url })
            .ToListAsync();

        var byTemplate = linked
            .GroupBy(x => x.JsonTemplateId!.Value)
            .ToDictionary(g => g.Key, g => (IReadOnlyList<LinkedRequestConfigSummary>)g.Select(x =>
                new LinkedRequestConfigSummary(x.Id, x.Name, x.Method, x.Url)).ToList());

        var templates = rows.Select(t =>
        {
            byTemplate.TryGetValue(t.Id, out var services);
            return ToDto(t, services ?? Array.Empty<LinkedRequestConfigSummary>());
        }).ToList();

        return Ok(templates);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<JsonTemplateDto>> GetById(int id)
    {
        var template = await _context.JsonTemplates.FindAsync(id);
        if (template == null)
            return NotFound();

        var linked = await GetLinkedServicesAsync(id);
        return Ok(ToDto(template, linked));
    }

    [HttpPost]
    public async Task<ActionResult<JsonTemplateDto>> Create(CreateJsonTemplateDto dto)
    {
        var template = new JsonTemplate
        {
            Name = dto.Name,
            Description = dto.Description,
            Content = dto.Content,
            SourceGroup = ResourceGroups.Manual,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.JsonTemplates.Add(template);
        await _context.SaveChangesAsync();

        try
        {
            if (dto.LinkRequestConfigId is > 0)
                await LinkTemplateToServiceAsync(template.Id, dto.LinkRequestConfigId.Value);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        var linked = await GetLinkedServicesAsync(template.Id);
        return CreatedAtAction(nameof(GetById), new { id = template.Id }, ToDto(template, linked));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateJsonTemplateDto dto)
    {
        var template = await _context.JsonTemplates.FindAsync(id);
        if (template == null)
            return NotFound();

        template.Name = dto.Name;
        template.Description = dto.Description;
        template.Content = dto.Content;
        template.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        if (dto.LinkRequestConfigId is > 0)
            await LinkTemplateToServiceAsync(id, dto.LinkRequestConfigId.Value);

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var template = await _context.JsonTemplates.FindAsync(id);
        if (template == null)
            return NotFound();

        _context.JsonTemplates.Remove(template);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<List<LinkedRequestConfigSummary>> GetLinkedServicesAsync(int templateId) =>
        await _context.RequestConfigs
            .Where(c => c.JsonTemplateId == templateId)
            .OrderBy(c => c.Name)
            .Select(c => new LinkedRequestConfigSummary(c.Id, c.Name, c.Method, c.Url))
            .ToListAsync();

    private async Task LinkTemplateToServiceAsync(int templateId, int requestConfigId)
    {
        var config = await _context.RequestConfigs.FindAsync(requestConfigId);
        if (config == null)
            throw new InvalidOperationException($"Servicio {requestConfigId} no encontrado.");

        config.JsonTemplateId = templateId;
        await _context.SaveChangesAsync();
    }

    private static JsonTemplateDto ToDto(JsonTemplate template, IReadOnlyList<LinkedRequestConfigSummary> linked) =>
        new(
            template.Id,
            template.Name,
            template.Description,
            template.Content,
            template.CreatedAt,
            template.UpdatedAt,
            template.SourceGroup,
            template.ApiCatalogId,
            template.OpenApiOperationKey,
            linked);
}
