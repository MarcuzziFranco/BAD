using BAD.API.DTOs;
using BAD.Core.Http;
using BAD.Storage.Context;
using BAD.Storage.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

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
            AuthType = dto.AuthType ?? "None",
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
        config.AuthType = dto.AuthType ?? "None";
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

    /// <summary>
    /// Parsea un comando cURL y devuelve la configuración extraída
    /// </summary>
    [HttpPost("parse-curl")]
    public ActionResult<ParsedCurlDto> ParseCurl([FromBody] ParseCurlRequestDto request)
    {
        try
        {
            var parsed = CurlParser.Parse(request.CurlCommand);
            
            return Ok(new ParsedCurlDto(
                parsed.Url,
                parsed.Method,
                parsed.Headers.Count > 0 ? JsonConvert.SerializeObject(parsed.Headers) : null,
                parsed.Body,
                parsed.AuthType,
                parsed.AuthValue,
                parsed.Warnings
            ));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = $"Error al parsear cURL: {ex.Message}" });
        }
    }

    /// <summary>
    /// Crea una configuración desde un comando cURL
    /// </summary>
    [HttpPost("from-curl")]
    public async Task<ActionResult<RequestConfigDto>> CreateFromCurl([FromBody] CreateFromCurlRequestDto request)
    {
        try
        {
            var parsed = CurlParser.Parse(request.CurlCommand);
            
            var config = new RequestConfig
            {
                Name = request.Name ?? $"Config desde cURL - {DateTime.Now:yyyy-MM-dd HH:mm}",
                Url = parsed.Url,
                Method = parsed.Method,
                Headers = parsed.Headers.Count > 0 ? JsonConvert.SerializeObject(parsed.Headers) : null,
                AuthType = parsed.AuthType ?? "None",
                AuthValue = parsed.AuthValue,
                JsonTemplateId = request.JsonTemplateId,
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
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = $"Error al crear configuración desde cURL: {ex.Message}" });
        }
    }
}
