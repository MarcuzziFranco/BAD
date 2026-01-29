using BAD.Models;
using Newtonsoft.Json;

namespace BAD.Services;

/// <summary>
/// Servicio para persistir resultados de ejecución
/// </summary>
public class ResultStorage
{
    private readonly string _baseOutputPath;

    public ResultStorage(string? basePath = null)
    {
        _baseOutputPath = basePath ?? Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "output");
    }

    /// <summary>
    /// Guarda los resultados de una ejecución completa
    /// </summary>
    public string SaveExecutionResults(
        List<RequestResult> results,
        ExecutionSummary summary,
        string sourceFileName)
    {
        // Crear carpeta con timestamp
        string timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
        string folderName = $"{timestamp}_{Path.GetFileNameWithoutExtension(sourceFileName)}";
        string outputPath = Path.Combine(_baseOutputPath, folderName);

        Directory.CreateDirectory(outputPath);

        // Crear subcarpetas
        string requestsPath = Path.Combine(outputPath, "requests");
        string responsesPath = Path.Combine(outputPath, "responses");
        Directory.CreateDirectory(requestsPath);
        Directory.CreateDirectory(responsesPath);

        // Guardar cada request/response
        foreach (var result in results)
        {
            string fileName = $"{result.Index:D4}.json";

            // Guardar request
            File.WriteAllText(
                Path.Combine(requestsPath, fileName),
                FormatJson(result.RequestPayload));

            // Guardar response
            var responseData = new
            {
                statusCode = (int)result.StatusCode,
                statusDescription = result.StatusCode.ToString(),
                duration = result.Duration.TotalMilliseconds,
                error = result.Error,
                body = TryParseJson(result.ResponseBody)
            };
            File.WriteAllText(
                Path.Combine(responsesPath, fileName),
                JsonConvert.SerializeObject(responseData, Formatting.Indented));
        }

        // Guardar resumen
        string summaryPath = Path.Combine(outputPath, "summary.json");
        File.WriteAllText(summaryPath, JsonConvert.SerializeObject(summary, Formatting.Indented));

        // Guardar reporte legible
        string reportPath = Path.Combine(outputPath, "report.txt");
        File.WriteAllText(reportPath, GenerateTextReport(results, summary));

        return outputPath;
    }

    /// <summary>
    /// Guarda los JSONs generados en archivos
    /// </summary>
    public string SaveGeneratedJsons(List<string> jsons, string sourceFileName, OutputFormat format)
    {
        string timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
        string outputPath = Path.Combine(_baseOutputPath, "generated");
        Directory.CreateDirectory(outputPath);

        if (format == OutputFormat.SingleFile)
        {
            // Todos en un archivo
            string fileName = $"{timestamp}_{Path.GetFileNameWithoutExtension(sourceFileName)}_all.json";
            string filePath = Path.Combine(outputPath, fileName);

            var jsonArray = jsons.Select(j => JsonConvert.DeserializeObject(j)).ToList();
            File.WriteAllText(filePath, JsonConvert.SerializeObject(jsonArray, Formatting.Indented));

            return filePath;
        }
        else
        {
            // Múltiples archivos
            string folderName = $"{timestamp}_{Path.GetFileNameWithoutExtension(sourceFileName)}";
            string folderPath = Path.Combine(outputPath, folderName);
            Directory.CreateDirectory(folderPath);

            for (int i = 0; i < jsons.Count; i++)
            {
                string fileName = $"{i + 1:D4}.json";
                File.WriteAllText(Path.Combine(folderPath, fileName), FormatJson(jsons[i]));
            }

            return folderPath;
        }
    }

    /// <summary>
    /// Genera un reporte de texto legible
    /// </summary>
    private string GenerateTextReport(List<RequestResult> results, ExecutionSummary summary)
    {
        var sb = new System.Text.StringBuilder();

        sb.AppendLine("╔════════════════════════════════════════════════════════════╗");
        sb.AppendLine("║             REPORTE DE EJECUCIÓN - BAD                     ║");
        sb.AppendLine("╚════════════════════════════════════════════════════════════╝");
        sb.AppendLine();
        sb.AppendLine($"Fecha: {summary.StartedAt:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine($"Archivo fuente: {summary.SourceFile}");
        sb.AppendLine($"Endpoint: {summary.HttpMethod} {summary.EndpointUrl}");
        sb.AppendLine();
        sb.AppendLine("─────────────────────────────────────────────────────────────");
        sb.AppendLine("                        ESTADÍSTICAS");
        sb.AppendLine("─────────────────────────────────────────────────────────────");
        sb.AppendLine($"  Total requests:     {summary.TotalRequests}");
        sb.AppendLine($"  Exitosos:           {summary.Successful} ({summary.SuccessRate:F1}%)");
        sb.AppendLine($"  Fallidos:           {summary.Failed}");
        sb.AppendLine($"  Tiempo promedio:    {summary.AverageResponseTime.TotalMilliseconds:F0}ms");
        sb.AppendLine($"  Tiempo mínimo:      {summary.MinResponseTime.TotalMilliseconds:F0}ms");
        sb.AppendLine($"  Tiempo máximo:      {summary.MaxResponseTime.TotalMilliseconds:F0}ms");
        sb.AppendLine($"  Duración total:     {summary.TotalDuration.TotalSeconds:F2}s");
        sb.AppendLine();

        if (summary.Errors.Count > 0)
        {
            sb.AppendLine("─────────────────────────────────────────────────────────────");
            sb.AppendLine("                         ERRORES");
            sb.AppendLine("─────────────────────────────────────────────────────────────");
            foreach (var error in summary.Errors)
            {
                sb.AppendLine($"  {error}");
            }
            sb.AppendLine();
        }

        sb.AppendLine("─────────────────────────────────────────────────────────────");
        sb.AppendLine("                    DETALLE DE REQUESTS");
        sb.AppendLine("─────────────────────────────────────────────────────────────");

        foreach (var result in results)
        {
            string status = result.IsSuccess ? "[OK]" : "[FAIL]";
            sb.AppendLine($"  #{result.Index + 1:D4} {status} HTTP {(int)result.StatusCode} - {result.Duration.TotalMilliseconds:F0}ms");
            if (!result.IsSuccess && !string.IsNullOrEmpty(result.Error))
            {
                sb.AppendLine($"         Error: {result.Error}");
            }
        }

        sb.AppendLine();
        sb.AppendLine("═════════════════════════════════════════════════════════════");

        return sb.ToString();
    }

    /// <summary>
    /// Intenta formatear JSON
    /// </summary>
    private string FormatJson(string json)
    {
        try
        {
            var obj = JsonConvert.DeserializeObject(json);
            return JsonConvert.SerializeObject(obj, Formatting.Indented);
        }
        catch
        {
            return json;
        }
    }

    /// <summary>
    /// Intenta parsear JSON o devuelve el string original
    /// </summary>
    private object TryParseJson(string content)
    {
        try
        {
            return JsonConvert.DeserializeObject(content) ?? content;
        }
        catch
        {
            return content;
        }
    }
}
