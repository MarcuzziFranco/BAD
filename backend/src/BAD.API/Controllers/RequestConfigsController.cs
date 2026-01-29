using BAD.API.DTOs;
using BAD.Storage.Context;
using BAD.Storage.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BAD.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RequestConfigsController : ControllerBase
{
    private readonly BadDbContext _context;

    public RequestConfigsController(BadDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Obtiene todas las configuraciones de request
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RequestConfigDto>>> GetAll()
    {
        var configs = await _context.RequestConfigs
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new RequestConfigDto(
                c.Id,
                c.Name,
                c.Url,
                c.Method,
                c.Headers,
                c.AuthType,
                c.AuthValue,
                c.JsonTemplateId,
                c.CreatedAt
            ))
            .ToListAsync();

        return Ok(configs);
    }

    /// <summary>
    /// Obtiene una configuración por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<RequestConfigDto>> GetById(int id)
    {
        var config = await _context.RequestConfigs.FindAsync(id);

        if (config == null)
            return NotFound();

        return Ok(new RequestConfigDto(
            config.Id,
            config.Name,
            config.Url,
            config.Method,
            config.Headers,
            config.AuthType,
            config.AuthValue,
            config.JsonTemplateId,
            config.CreatedAt
        ));
    }

    /// <summary>
    /// Crea una nueva configuración de request
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<RequestConfigDto>> Create(CreateRequestConfigDto dto)
    {
        var config = new RequestConfig
        {
            Name = dto.Name,
            Url = dto.Url,
            Method = dto.Method,
            Headers = dto.Headers,
            AuthType = dto.AuthType,
            AuthValue = dto.AuthValue,
            JsonTemplateId = dto.JsonTemplateId,
            CreatedAt = DateTime.UtcNow
        };

        _context.RequestConfigs.Add(config);
        await _context.SaveChangesAsync();

        var result = new RequestConfigDto(
            config.Id,
            config.Name,
            config.Url,
            config.Method,
            config.Headers,
            config.AuthType,
            config.AuthValue,
            config.JsonTemplateId,
            config.CreatedAt
        );

        return CreatedAtAction(nameof(GetById), new { id = config.Id }, result);
    }

    /// <summary>
    /// Actualiza una configuración existente
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateRequestConfigDto dto)
    {
        var config = await _context.RequestConfigs.FindAsync(id);

        if (config == null)
            return NotFound();

        config.Name = dto.Name;
        config.Url = dto.Url;
        config.Method = dto.Method;
        config.Headers = dto.Headers;
        config.AuthType = dto.AuthType;
        config.AuthValue = dto.AuthValue;
        config.JsonTemplateId = dto.JsonTemplateId;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Elimina una configuración
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var config = await _context.RequestConfigs.FindAsync(id);

        if (config == null)
            return NotFound();

        _context.RequestConfigs.Remove(config);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
