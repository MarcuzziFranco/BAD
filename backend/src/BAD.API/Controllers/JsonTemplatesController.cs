using BAD.API.DTOs;
using BAD.Storage.Context;
using BAD.Storage.Entities;
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

    /// <summary>
    /// Obtiene todos los templates JSON
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<JsonTemplateDto>>> GetAll()
    {
        var templates = await _context.JsonTemplates
            .OrderByDescending(t => t.UpdatedAt)
            .Select(t => new JsonTemplateDto(
                t.Id,
                t.Name,
                t.Description,
                t.Content,
                t.CreatedAt,
                t.UpdatedAt
            ))
            .ToListAsync();

        return Ok(templates);
    }

    /// <summary>
    /// Obtiene un template por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<JsonTemplateDto>> GetById(int id)
    {
        var template = await _context.JsonTemplates.FindAsync(id);

        if (template == null)
            return NotFound();

        return Ok(new JsonTemplateDto(
            template.Id,
            template.Name,
            template.Description,
            template.Content,
            template.CreatedAt,
            template.UpdatedAt
        ));
    }

    /// <summary>
    /// Crea un nuevo template JSON
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<JsonTemplateDto>> Create(CreateJsonTemplateDto dto)
    {
        var template = new JsonTemplate
        {
            Name = dto.Name,
            Description = dto.Description,
            Content = dto.Content,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.JsonTemplates.Add(template);
        await _context.SaveChangesAsync();

        var result = new JsonTemplateDto(
            template.Id,
            template.Name,
            template.Description,
            template.Content,
            template.CreatedAt,
            template.UpdatedAt
        );

        return CreatedAtAction(nameof(GetById), new { id = template.Id }, result);
    }

    /// <summary>
    /// Actualiza un template existente
    /// </summary>
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

        return NoContent();
    }

    /// <summary>
    /// Elimina un template
    /// </summary>
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
}
