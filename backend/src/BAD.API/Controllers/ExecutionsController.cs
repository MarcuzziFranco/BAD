using BAD.API.DTOs;
using BAD.Core.Generators;
using BAD.Core.Http;
using BAD.Core.Models;
using BAD.Core.Presets;
using BAD.Storage.Context;
using BAD.Storage.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BAD.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExecutionsController : ControllerBase
{
    private readonly BadDbContext _context;
    private readonly PresetManager _presetManager;

    public ExecutionsController(BadDbContext context)
    {
        _context = context;
        _presetManager = new PresetManager();
    }

    /// <summary>
    /// Obtiene el historial de ejecuciones
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TestExecutionDto>>> GetAll()
    {
        var executions = await _context.TestExecutions
            .OrderByDescending(e => e.ExecutedAt)
            .Select(e => new TestExecutionDto(
                e.Id,
                e.RequestConfigId,
                e.PresetUsed,
                e.TotalRequests,
                e.SuccessCount,
                e.FailureCount,
                e.AvgResponseTimeMs,
                e.MinResponseTimeMs,
                e.MaxResponseTimeMs,
                e.ExecutedAt
            ))
            .ToListAsync();

        return Ok(executions);
    }

    /// <summary>
    /// Obtiene el detalle de una ejecución con sus resultados
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<TestExecutionDetailDto>> GetById(int id)
    {
        var execution = await _context.TestExecutions
            .Include(e => e.Results)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (execution == null)
            return NotFound();

        var dto = new TestExecutionDetailDto(
            execution.Id,
            execution.RequestConfigId,
            execution.PresetUsed,
            execution.TotalRequests,
            execution.SuccessCount,
            execution.FailureCount,
            execution.AvgResponseTimeMs,
            execution.MinResponseTimeMs,
            execution.MaxResponseTimeMs,
            execution.ExecutedAt,
            execution.Results.OrderBy(r => r.Index).Select(r => new TestResultDto(
                r.Id,
                r.Index,
                r.RequestPayload,
                r.ResponseBody,
                r.StatusCode,
                r.DurationMs,
                r.Error,
                r.IsSuccess
            )).ToList()
        );

        return Ok(dto);
    }

    /// <summary>
    /// Ejecuta un test con la configuración especificada
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TestExecutionDto>> Execute(ExecuteTestDto dto)
    {
        // Obtener la configuración de request
        var requestConfig = await _context.RequestConfigs
            .Include(c => c.JsonTemplate)
            .FirstOrDefaultAsync(c => c.Id == dto.RequestConfigId);

        if (requestConfig == null)
            return NotFound("Configuración de request no encontrada");

        if (requestConfig.JsonTemplate == null)
            return BadRequest("La configuración no tiene un template JSON asociado");

        try
        {
            // Generar los JSONs
            var jsonObject = JObject.Parse(requestConfig.JsonTemplate.Content);
            var generator = new GeneratorJson();
            string? presetApplied = null;

            if (!string.IsNullOrEmpty(dto.PresetName))
            {
                var preset = _presetManager.GetPresetByName(dto.PresetName);
                if (preset != null)
                {
                    _presetManager.ApplyPreset(preset, jsonObject, generator);
                    presetApplied = preset.Name;
                }
            }

            var generatedJsons = generator.GenerateMultiple(requestConfig.JsonTemplate.Content, dto.Count);

            // Configurar executor
            using var executor = new RequestExecutor();
            
            // Configurar headers si existen
            if (!string.IsNullOrEmpty(requestConfig.Headers))
            {
                var headers = JsonConvert.DeserializeObject<Dictionary<string, string>>(requestConfig.Headers);
                if (headers != null)
                    executor.SetHeaders(headers);
            }

            // Configurar autenticación
            if (requestConfig.AuthType == "Bearer" && !string.IsNullOrEmpty(requestConfig.AuthValue))
            {
                executor.SetBearerToken(requestConfig.AuthValue);
            }

            // Ejecutar las requests
            var method = Enum.Parse<HttpMethodType>(requestConfig.Method, true);
            var results = await executor.ExecuteBatchAsync(
                requestConfig.Url,
                method,
                generatedJsons,
                dto.Sequential
            );

            // Guardar ejecución
            var execution = new TestExecution
            {
                RequestConfigId = requestConfig.Id,
                PresetUsed = presetApplied,
                TotalRequests = results.Count,
                SuccessCount = results.Count(r => r.IsSuccess),
                FailureCount = results.Count(r => !r.IsSuccess),
                AvgResponseTimeMs = results.Average(r => r.Duration.TotalMilliseconds),
                MinResponseTimeMs = results.Min(r => r.Duration.TotalMilliseconds),
                MaxResponseTimeMs = results.Max(r => r.Duration.TotalMilliseconds),
                ExecutedAt = DateTime.UtcNow,
                Results = results.Select(r => new TestResult
                {
                    Index = r.Index,
                    RequestPayload = r.RequestPayload,
                    ResponseBody = r.ResponseBody,
                    StatusCode = (int)r.StatusCode,
                    DurationMs = r.Duration.TotalMilliseconds,
                    Error = r.Error,
                    IsSuccess = r.IsSuccess
                }).ToList()
            };

            _context.TestExecutions.Add(execution);
            await _context.SaveChangesAsync();

            return Ok(new TestExecutionDto(
                execution.Id,
                execution.RequestConfigId,
                execution.PresetUsed,
                execution.TotalRequests,
                execution.SuccessCount,
                execution.FailureCount,
                execution.AvgResponseTimeMs,
                execution.MinResponseTimeMs,
                execution.MaxResponseTimeMs,
                execution.ExecutedAt
            ));
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Elimina una ejecución y sus resultados
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var execution = await _context.TestExecutions.FindAsync(id);

        if (execution == null)
            return NotFound();

        _context.TestExecutions.Remove(execution);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
