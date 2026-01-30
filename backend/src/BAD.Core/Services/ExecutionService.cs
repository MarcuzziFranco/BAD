using System.Collections.Concurrent;
using BAD.Core.Configurations;
using BAD.Core.Generators;
using BAD.Core.Http;
using BAD.Core.Models;
using BAD.Core.Presets;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BAD.Core.Services;

/// <summary>
/// Servicio para ejecutar tests con configuración del wizard
/// </summary>
public class ExecutionService : IDisposable
{
    private readonly PresetManager _presetManager;
    private CancellationTokenSource? _cancellationTokenSource;
    private readonly ConcurrentDictionary<int, ExecutionProgress> _progressCache = new();

    public ExecutionService()
    {
        _presetManager = new PresetManager();
    }

    /// <summary>
    /// Progreso de una ejecución
    /// </summary>
    public class ExecutionProgress
    {
        public int ExecutionId { get; set; }
        public string Status { get; set; } = "running";
        public int Completed { get; set; }
        public int Total { get; set; }
        public int Successful { get; set; }
        public int Failed { get; set; }
        public double TotalResponseTimeMs { get; set; }
        public double MinResponseTimeMs { get; set; } = double.MaxValue;
        public double MaxResponseTimeMs { get; set; }
        public RequestResult? LastResult { get; set; }
    }

    /// <summary>
    /// Configuración de ejecución desde el wizard
    /// </summary>
    public class ExecutionConfig
    {
        public int ExecutionId { get; set; }
        public string Url { get; set; } = string.Empty;
        public HttpMethodType Method { get; set; }
        public Dictionary<string, string>? Headers { get; set; }
        public string? AuthType { get; set; }
        public string? AuthValue { get; set; }
        
        // Body configuration
        public string BodyMode { get; set; } = "none";
        public string? BaseJson { get; set; }
        public List<FieldMutationConfig>? Mutations { get; set; }
        public string? PresetName { get; set; }
        
        // Execution configuration
        public int RequestCount { get; set; }
        public string ExecutionMode { get; set; } = "sequential";
        public int IntervalMs { get; set; }
        public bool MutatePerIteration { get; set; }
    }

    /// <summary>
    /// Configuración de mutación de campo
    /// </summary>
    public class FieldMutationConfig
    {
        public string Key { get; set; } = string.Empty;
        public string Operation { get; set; } = string.Empty;
        public object? Value { get; set; }
        public object? MinValue { get; set; }
        public object? MaxValue { get; set; }
        public List<object>? ListValues { get; set; }
    }

    /// <summary>
    /// Ejecuta el test con la configuración proporcionada
    /// </summary>
    public async Task<List<RequestResult>> ExecuteAsync(
        ExecutionConfig config,
        Action<ExecutionProgress>? onProgress = null)
    {
        _cancellationTokenSource = new CancellationTokenSource();
        var cancellationToken = _cancellationTokenSource.Token;
        
        var progress = new ExecutionProgress
        {
            ExecutionId = config.ExecutionId,
            Total = config.RequestCount,
            Status = "running"
        };
        _progressCache[config.ExecutionId] = progress;

        var results = new List<RequestResult>();

        using var executor = new RequestExecutor();
        
        // Configurar headers
        if (config.Headers != null && config.Headers.Count > 0)
        {
            executor.SetHeaders(config.Headers);
        }

        // Configurar autenticación
        ConfigureAuthentication(executor, config.AuthType, config.AuthValue);

        // Generar JSONs según el modo
        var jsonPayloads = GeneratePayloads(config);

        try
        {
            switch (config.ExecutionMode.ToLower())
            {
                case "sequential":
                    results = await ExecuteSequentialAsync(
                        executor, config, jsonPayloads, progress, onProgress, cancellationToken);
                    break;
                case "parallel":
                    results = await ExecuteParallelAsync(
                        executor, config, jsonPayloads, progress, onProgress, cancellationToken);
                    break;
                case "burst":
                    results = await ExecuteBurstAsync(
                        executor, config, jsonPayloads, progress, onProgress, cancellationToken);
                    break;
                default:
                    results = await ExecuteSequentialAsync(
                        executor, config, jsonPayloads, progress, onProgress, cancellationToken);
                    break;
            }

            progress.Status = "completed";
        }
        catch (OperationCanceledException)
        {
            progress.Status = "cancelled";
        }
        catch (Exception)
        {
            progress.Status = "failed";
            throw;
        }
        finally
        {
            onProgress?.Invoke(progress);
        }

        return results;
    }

    /// <summary>
    /// Cancela la ejecución actual
    /// </summary>
    public void Cancel(int executionId)
    {
        _cancellationTokenSource?.Cancel();
        if (_progressCache.TryGetValue(executionId, out var progress))
        {
            progress.Status = "cancelled";
        }
    }

    /// <summary>
    /// Obtiene el progreso de una ejecución
    /// </summary>
    public ExecutionProgress? GetProgress(int executionId)
    {
        return _progressCache.TryGetValue(executionId, out var progress) ? progress : null;
    }

    private void ConfigureAuthentication(RequestExecutor executor, string? authType, string? authValue)
    {
        if (string.IsNullOrEmpty(authType) || authType == "None" || string.IsNullOrEmpty(authValue))
            return;

        switch (authType)
        {
            case "Bearer":
                executor.SetBearerToken(authValue);
                break;
            case "Basic":
                var parts = authValue.Split(':');
                if (parts.Length == 2)
                {
                    executor.SetBasicAuth(parts[0], parts[1]);
                }
                break;
            case "ApiKey":
                executor.SetHeaders(new Dictionary<string, string> { { "X-API-Key", authValue } });
                break;
        }
    }

    private List<string> GeneratePayloads(ExecutionConfig config)
    {
        var payloads = new List<string>();

        if (config.BodyMode == "none" || string.IsNullOrEmpty(config.BaseJson))
        {
            // Sin body, generar strings vacíos
            for (int i = 0; i < config.RequestCount; i++)
            {
                payloads.Add("{}");
            }
            return payloads;
        }

        var generator = new GeneratorJson();
        var jsonObject = JObject.Parse(config.BaseJson);

        // Aplicar preset si existe
        if (!string.IsNullOrEmpty(config.PresetName))
        {
            var preset = _presetManager.GetPresetByName(config.PresetName);
            if (preset != null)
            {
                _presetManager.ApplyPreset(preset, jsonObject, generator);
            }
        }

        // Aplicar mutaciones personalizadas
        if (config.Mutations != null && config.Mutations.Count > 0)
        {
            foreach (var mutation in config.Mutations)
            {
                var defaultConfig = ConvertToDefaultValueConfig(mutation);
                generator.AddDefaultValue(mutation.Key, defaultConfig);
            }
        }

        // Generar payloads
        if (config.MutatePerIteration)
        {
            // Generar un JSON diferente para cada request
            payloads = generator.GenerateMultiple(config.BaseJson, config.RequestCount);
        }
        else
        {
            // Generar un solo JSON y usarlo para todas las requests
            var singleJsonList = generator.GenerateMultiple(config.BaseJson, 1);
            var singleJson = singleJsonList.FirstOrDefault() ?? config.BaseJson;
            for (int i = 0; i < config.RequestCount; i++)
            {
                payloads.Add(singleJson);
            }
        }

        return payloads;
    }

    private DefaultValueConfig ConvertToDefaultValueConfig(FieldMutationConfig mutation)
    {
        // Mapear operaciones del frontend a EnumOperations
        var operation = mutation.Operation?.ToLower() switch
        {
            "random" => EnumOperations.Replace,
            "replace" => EnumOperations.Replace,
            "forcenull" => EnumOperations.ForceNull,
            "notchange" => EnumOperations.NotChange,
            "randomrange" => EnumOperations.RandomRange,
            "rotatelist" => EnumOperations.Replace,
            _ => EnumOperations.Replace
        };

        // Si es RotateList, el valor debe ser el array de valores
        var value = mutation.Operation?.ToLower() == "rotatelist" && mutation.ListValues != null
            ? mutation.ListValues.ToArray()
            : mutation.Value;

        return new DefaultValueConfig
        {
            Operation = operation,
            Value = value,
            MinValue = mutation.MinValue,
            MaxValue = mutation.MaxValue
        };
    }

    private async Task<List<RequestResult>> ExecuteSequentialAsync(
        RequestExecutor executor,
        ExecutionConfig config,
        List<string> jsonPayloads,
        ExecutionProgress progress,
        Action<ExecutionProgress>? onProgress,
        CancellationToken cancellationToken)
    {
        var results = new List<RequestResult>();

        for (int i = 0; i < jsonPayloads.Count; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var result = await executor.ExecuteSingleRequestAsync(
                config.Url, config.Method, jsonPayloads[i], i);
            
            results.Add(result);
            UpdateProgress(progress, result);
            onProgress?.Invoke(progress);

            // Esperar intervalo si está configurado
            if (config.IntervalMs > 0 && i < jsonPayloads.Count - 1)
            {
                await Task.Delay(config.IntervalMs, cancellationToken);
            }
        }

        return results;
    }

    private async Task<List<RequestResult>> ExecuteParallelAsync(
        RequestExecutor executor,
        ExecutionConfig config,
        List<string> jsonPayloads,
        ExecutionProgress progress,
        Action<ExecutionProgress>? onProgress,
        CancellationToken cancellationToken)
    {
        var semaphore = new SemaphoreSlim(10); // Máximo 10 concurrentes
        var results = new ConcurrentBag<RequestResult>();
        
        var tasks = jsonPayloads.Select(async (payload, index) =>
        {
            await semaphore.WaitAsync(cancellationToken);
            try
            {
                cancellationToken.ThrowIfCancellationRequested();
                var result = await executor.ExecuteSingleRequestAsync(
                    config.Url, config.Method, payload, index);
                
                results.Add(result);
                UpdateProgress(progress, result);
                onProgress?.Invoke(progress);
            }
            finally
            {
                semaphore.Release();
            }
        });

        await Task.WhenAll(tasks);
        return results.OrderBy(r => r.Index).ToList();
    }

    private async Task<List<RequestResult>> ExecuteBurstAsync(
        RequestExecutor executor,
        ExecutionConfig config,
        List<string> jsonPayloads,
        ExecutionProgress progress,
        Action<ExecutionProgress>? onProgress,
        CancellationToken cancellationToken)
    {
        var results = new List<RequestResult>();
        var batchSize = 10; // Requests por ráfaga
        
        for (int i = 0; i < jsonPayloads.Count; i += batchSize)
        {
            cancellationToken.ThrowIfCancellationRequested();
            
            var batch = jsonPayloads.Skip(i).Take(batchSize).ToList();
            var batchTasks = batch.Select((payload, idx) =>
                executor.ExecuteSingleRequestAsync(config.Url, config.Method, payload, i + idx));
            
            var batchResults = await Task.WhenAll(batchTasks);
            
            foreach (var result in batchResults)
            {
                results.Add(result);
                UpdateProgress(progress, result);
            }
            
            onProgress?.Invoke(progress);

            // Pausa entre ráfagas
            if (i + batchSize < jsonPayloads.Count && config.IntervalMs > 0)
            {
                await Task.Delay(config.IntervalMs, cancellationToken);
            }
        }

        return results.OrderBy(r => r.Index).ToList();
    }

    private void UpdateProgress(ExecutionProgress progress, RequestResult result)
    {
        progress.Completed++;
        progress.TotalResponseTimeMs += result.Duration.TotalMilliseconds;
        progress.MinResponseTimeMs = Math.Min(progress.MinResponseTimeMs, result.Duration.TotalMilliseconds);
        progress.MaxResponseTimeMs = Math.Max(progress.MaxResponseTimeMs, result.Duration.TotalMilliseconds);
        progress.LastResult = result;

        if (result.IsSuccess)
            progress.Successful++;
        else
            progress.Failed++;
    }

    public void Dispose()
    {
        _cancellationTokenSource?.Dispose();
    }
}
