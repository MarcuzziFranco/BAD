using BAD.API.DTOs;
using BAD.Core.Generators;
using BAD.Core.Http;
using BAD.Core.Models;
using BAD.Core.Presets;
using BAD.Core.Services;
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
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private static readonly Dictionary<int, ExecutionService> _activeExecutions = new();

    public ExecutionsController(BadDbContext context, IServiceScopeFactory serviceScopeFactory)
    {
        _context = context;
        _presetManager = new PresetManager();
        _serviceScopeFactory = serviceScopeFactory;
    }

    /// <summary>
    /// Obtiene el historial de ejecuciones
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TestExecutionDto>>> GetAll()
    {
        var executions = await _context.TestExecutions
            .Include(e => e.RequestConfig)
            .OrderByDescending(e => e.ExecutedAt)
            .Select(e => new TestExecutionDto(
                e.Id,
                e.RequestConfigId,
                e.RequestConfig.Name,
                e.PresetUsed,
                e.Status,
                e.ExecutionMode,
                e.BodyMode,
                e.TotalRequests,
                e.SuccessCount,
                e.FailureCount,
                e.AvgResponseTimeMs,
                e.MinResponseTimeMs,
                e.MaxResponseTimeMs,
                e.ExecutedAt,
                e.FinishedAt
            ))
            .ToListAsync();

        return Ok(executions);
    }

    /// <summary>
    /// Obtiene el detalle de una ejecución
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<TestExecutionDetailDto>> GetById(int id)
    {
        var execution = await _context.TestExecutions
            .Include(e => e.RequestConfig)
            .Include(e => e.Template)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (execution == null)
            return NotFound();

        var dto = new TestExecutionDetailDto(
            execution.Id,
            execution.RequestConfigId,
            execution.RequestConfig?.Name,
            execution.RequestConfig?.Url,
            execution.RequestConfig?.Method,
            execution.PresetUsed,
            execution.Status,
            execution.ExecutionMode,
            execution.BodyMode,
            execution.TemplateId,
            execution.Template?.Name,
            execution.BaseJson,
            execution.MutationsConfig,
            execution.IntervalMs,
            execution.MutatePerIteration,
            execution.TotalRequests,
            execution.SuccessCount,
            execution.FailureCount,
            execution.AvgResponseTimeMs,
            execution.MinResponseTimeMs,
            execution.MaxResponseTimeMs,
            execution.ExecutedAt,
            execution.FinishedAt
        );

        return Ok(dto);
    }

    /// <summary>
    /// Obtiene los resultados paginados de una ejecución
    /// </summary>
    [HttpGet("{id}/results")]
    public async Task<ActionResult<PaginatedResultsDto>> GetResults(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var execution = await _context.TestExecutions.FindAsync(id);
        if (execution == null)
            return NotFound();

        var totalCount = await _context.TestResults.CountAsync(r => r.TestExecutionId == id);
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var results = await _context.TestResults
            .Where(r => r.TestExecutionId == id)
            .OrderBy(r => r.Index)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new TestResultDto(
                r.Id,
                r.Index,
                r.RequestPayload,
                r.RequestHeaders,
                r.ResponseBody,
                r.ResponseHeaders,
                r.StatusCode,
                r.DurationMs,
                r.Error,
                r.IsSuccess,
                r.ExecutedAt
            ))
            .ToListAsync();

        return Ok(new PaginatedResultsDto(results, totalCount, page, pageSize, totalPages));
    }

    /// <summary>
    /// Inicia una nueva ejecución desde el wizard
    /// </summary>
    [HttpPost("start")]
    public async Task<ActionResult<TestExecutionDto>> Start(CreateExecutionDto dto)
    {
        // Obtener la configuración de request
        var requestConfig = await _context.RequestConfigs
            .FirstOrDefaultAsync(c => c.Id == dto.RequestConfigId);

        if (requestConfig == null)
            return NotFound("Configuración de request no encontrada");

        // Obtener template si se especifica
        JsonTemplate? template = null;
        string? baseJson = dto.BaseJson;
        
        if (dto.TemplateId.HasValue)
        {
            template = await _context.JsonTemplates.FindAsync(dto.TemplateId.Value);
            if (template != null && string.IsNullOrEmpty(baseJson))
            {
                baseJson = template.Content;
            }
        }

        string? presetUsedLabel = dto.PresetName;
        List<FieldConfigDto>? effectiveMutations = dto.Mutations;
        string? executionPresetName = dto.PresetName;

        if (dto.DataPresetId.HasValue)
        {
            var gs = await _context.GeneratorSettings.AsNoTracking()
                .FirstOrDefaultAsync(g => g.Id == dto.DataPresetId.Value);

            if (gs == null)
                return NotFound("Preset de datos no encontrado");

            if (!dto.TemplateId.HasValue || gs.JsonTemplateId != dto.TemplateId.Value)
                return BadRequest("El preset de datos debe corresponder al template seleccionado.");

            try
            {
                effectiveMutations = JsonConvert.DeserializeObject<List<FieldConfigDto>>(gs.FieldConfigurations)
                    ?? new List<FieldConfigDto>();
            }
            catch
            {
                return BadRequest("Preset de datos con configuración inválida");
            }

            presetUsedLabel = $"data-preset:{gs.Name}";
            executionPresetName = null;
        }

        try
        {
            // Crear registro de ejecución
            var execution = new TestExecution
            {
                RequestConfigId = requestConfig.Id,
                Status = "running",
                ExecutionMode = dto.ExecutionMode,
                BodyMode = dto.BodyMode,
                BaseJson = baseJson,
                MutationsConfig = effectiveMutations != null && effectiveMutations.Count > 0
                    ? JsonConvert.SerializeObject(effectiveMutations)
                    : null,
                TemplateId = dto.TemplateId,
                IntervalMs = dto.IntervalMs,
                MutatePerIteration = dto.MutatePerIteration,
                PresetUsed = presetUsedLabel,
                TotalRequests = dto.RequestCount,
                ExecutedAt = DateTime.UtcNow
            };

            _context.TestExecutions.Add(execution);
            await _context.SaveChangesAsync();

            // Configurar y ejecutar
            var service = new ExecutionService();
            _activeExecutions[execution.Id] = service;

            var config = new ExecutionService.ExecutionConfig
            {
                ExecutionId = execution.Id,
                Url = requestConfig.Url,
                Method = Enum.Parse<HttpMethodType>(requestConfig.Method, true),
                Headers = !string.IsNullOrEmpty(requestConfig.Headers) 
                    ? JsonConvert.DeserializeObject<Dictionary<string, string>>(requestConfig.Headers) 
                    : null,
                AuthType = requestConfig.AuthType,
                AuthValue = requestConfig.AuthValue,
                BodyMode = dto.BodyMode,
                BaseJson = baseJson,
                Mutations = effectiveMutations?.Select(m => new ExecutionService.FieldMutationConfig
                {
                    Key = m.Key,
                    Operation = m.Operation,
                    Value = m.Value,
                    MinValue = m.MinValue,
                    MaxValue = m.MaxValue,
                    ListValues = m.ListValues
                }).ToList(),
                PresetName = executionPresetName,
                RequestCount = dto.RequestCount,
                ExecutionMode = dto.ExecutionMode,
                IntervalMs = dto.IntervalMs,
                MutatePerIteration = dto.MutatePerIteration
            };

            // Capturar el scope factory para usar en el background task
            var scopeFactory = _serviceScopeFactory;
            
            // Ejecutar en background
            _ = Task.Run(async () =>
            {
                try
                {
                    var results = await service.ExecuteAsync(config);
                    
                    // Actualizar ejecución con resultados
                    using var scope = scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<BadDbContext>();
                    
                    var exec = await db.TestExecutions.FindAsync(execution.Id);
                    if (exec != null)
                    {
                        exec.Status = "completed";
                        exec.FinishedAt = DateTime.UtcNow;
                        exec.SuccessCount = results.Count(r => r.IsSuccess);
                        exec.FailureCount = results.Count(r => !r.IsSuccess);
                        if (results.Any())
                        {
                            exec.AvgResponseTimeMs = results.Average(r => r.Duration.TotalMilliseconds);
                            exec.MinResponseTimeMs = results.Min(r => r.Duration.TotalMilliseconds);
                            exec.MaxResponseTimeMs = results.Max(r => r.Duration.TotalMilliseconds);
                        }

                        // Guardar resultados
                        foreach (var r in results)
                        {
                            db.TestResults.Add(new TestResult
                            {
                                TestExecutionId = execution.Id,
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

                        await db.SaveChangesAsync();
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error en ejecución {execution.Id}: {ex.Message}");
                    using var scope = scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<BadDbContext>();
                    var exec = await db.TestExecutions.FindAsync(execution.Id);
                    if (exec != null)
                    {
                        exec.Status = "failed";
                        exec.FinishedAt = DateTime.UtcNow;
                        await db.SaveChangesAsync();
                    }
                }
                finally
                {
                    _activeExecutions.Remove(execution.Id);
                    service.Dispose();
                }
            });

            return Ok(new TestExecutionDto(
                execution.Id,
                execution.RequestConfigId,
                requestConfig.Name,
                execution.PresetUsed,
                execution.Status,
                execution.ExecutionMode,
                execution.BodyMode,
                execution.TotalRequests,
                execution.SuccessCount,
                execution.FailureCount,
                execution.AvgResponseTimeMs,
                execution.MinResponseTimeMs,
                execution.MaxResponseTimeMs,
                execution.ExecutedAt,
                execution.FinishedAt
            ));
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Obtiene el progreso de una ejecución en curso
    /// </summary>
    [HttpGet("{id}/progress")]
    public async Task<ActionResult<ExecutionProgressDto>> GetProgress(int id)
    {
        var execution = await _context.TestExecutions.FindAsync(id);
        if (execution == null)
            return NotFound();

        // Si hay una ejecución activa, obtener progreso en tiempo real
        if (_activeExecutions.TryGetValue(id, out var service))
        {
            var progress = service.GetProgress(id);
            if (progress != null)
            {
                TestResultDto? lastResult = null;
                if (progress.LastResult != null)
                {
                    var r = progress.LastResult;
                    lastResult = new TestResultDto(
                        0, r.Index, r.RequestPayload, null, r.ResponseBody, null,
                        (int)r.StatusCode, r.Duration.TotalMilliseconds, r.Error, r.IsSuccess, r.ExecutedAt
                    );
                }

                return Ok(new ExecutionProgressDto(
                    id,
                    progress.Status,
                    progress.Completed,
                    progress.Total,
                    progress.Successful,
                    progress.Failed,
                    progress.Completed > 0 ? progress.TotalResponseTimeMs / progress.Completed : 0,
                    lastResult
                ));
            }
        }

        // Si no hay ejecución activa, devolver estado de la BD
        var successCount = await _context.TestResults.CountAsync(r => r.TestExecutionId == id && r.IsSuccess);
        var failCount = await _context.TestResults.CountAsync(r => r.TestExecutionId == id && !r.IsSuccess);
        var completed = successCount + failCount;

        return Ok(new ExecutionProgressDto(
            id,
            execution.Status,
            completed,
            execution.TotalRequests,
            successCount,
            failCount,
            execution.AvgResponseTimeMs,
            null
        ));
    }

    /// <summary>
    /// Cancela una ejecución en curso
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var execution = await _context.TestExecutions.FindAsync(id);
        if (execution == null)
            return NotFound();

        if (_activeExecutions.TryGetValue(id, out var service))
        {
            service.Cancel(id);
        }

        execution.Status = "cancelled";
        execution.FinishedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Ejecución cancelada" });
    }

    /// <summary>
    /// Re-ejecuta una ejecución anterior con la misma configuración
    /// </summary>
    [HttpPost("{id}/rerun")]
    public async Task<ActionResult<TestExecutionDto>> Rerun(int id)
    {
        var original = await _context.TestExecutions
            .Include(e => e.RequestConfig)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (original == null)
            return NotFound("Ejecución no encontrada");

        if (original.RequestConfig == null)
            return BadRequest("La configuración de request ya no existe");

        // Deserializar mutaciones si existen
        List<FieldConfigDto>? mutations = null;
        if (!string.IsNullOrEmpty(original.MutationsConfig))
        {
            try
            {
                mutations = JsonConvert.DeserializeObject<List<FieldConfigDto>>(original.MutationsConfig);
            }
            catch
            {
                // Si falla deserializar, continuar sin mutaciones
            }
        }

        // Crear DTO con la configuración original
        var createDto = new CreateExecutionDto(
            original.RequestConfigId,
            original.BodyMode,
            original.BaseJson,
            original.TemplateId,
            mutations,
            original.TotalRequests,
            original.ExecutionMode,
            original.IntervalMs,
            original.MutatePerIteration,
            original.PresetUsed,
            null);

        return await Start(createDto);
    }

    /// <summary>
    /// Ejecuta un test con la configuración especificada (legacy)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TestExecutionDto>> Execute(ExecuteTestDto dto)
    {
        // Convertir a nuevo formato
        var createDto = new CreateExecutionDto(
            dto.RequestConfigId,
            "template",
            null,
            null,
            null,
            dto.Count,
            dto.Sequential ? "sequential" : "parallel",
            0,
            true,
            dto.PresetName,
            null);

        return await Start(createDto);
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

        // Cancelar si está en ejecución
        if (_activeExecutions.TryGetValue(id, out var service))
        {
            service.Cancel(id);
            _activeExecutions.Remove(id);
        }

        _context.TestExecutions.Remove(execution);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
