namespace BAD.Storage.Entities;

/// <summary>
/// Registro de ejecución de tests
/// </summary>
public class TestExecution
{
    public int Id { get; set; }
    
    /// <summary>
    /// ID de la configuración de request usada
    /// </summary>
    public int RequestConfigId { get; set; }
    
    /// <summary>
    /// Nombre del preset usado (si aplica)
    /// </summary>
    public string? PresetUsed { get; set; }
    
    /// <summary>
    /// Estado de la ejecución: pending, running, completed, failed, cancelled
    /// </summary>
    public string Status { get; set; } = "pending";
    
    /// <summary>
    /// Modo de ejecución: sequential, parallel, burst
    /// </summary>
    public string ExecutionMode { get; set; } = "sequential";
    
    /// <summary>
    /// Intervalo entre requests en milisegundos
    /// </summary>
    public int IntervalMs { get; set; } = 0;
    
    /// <summary>
    /// Si debe mutar el JSON en cada iteración
    /// </summary>
    public bool MutatePerIteration { get; set; } = false;
    
    /// <summary>
    /// Modo del body: none, static, template, template_mutated
    /// </summary>
    public string BodyMode { get; set; } = "none";
    
    /// <summary>
    /// JSON base usado para la ejecución
    /// </summary>
    public string? BaseJson { get; set; }
    
    /// <summary>
    /// Configuración de mutaciones en formato JSON
    /// </summary>
    public string? MutationsConfig { get; set; }
    
    /// <summary>
    /// ID del template usado (si aplica)
    /// </summary>
    public int? TemplateId { get; set; }
    
    /// <summary>
    /// Total de requests ejecutadas
    /// </summary>
    public int TotalRequests { get; set; }
    
    /// <summary>
    /// Número de requests exitosas
    /// </summary>
    public int SuccessCount { get; set; }
    
    /// <summary>
    /// Número de requests fallidas
    /// </summary>
    public int FailureCount { get; set; }
    
    /// <summary>
    /// Tiempo promedio de respuesta en milisegundos
    /// </summary>
    public double AvgResponseTimeMs { get; set; }
    
    /// <summary>
    /// Tiempo mínimo de respuesta en milisegundos
    /// </summary>
    public double MinResponseTimeMs { get; set; }
    
    /// <summary>
    /// Tiempo máximo de respuesta en milisegundos
    /// </summary>
    public double MaxResponseTimeMs { get; set; }
    
    /// <summary>
    /// Fecha y hora de inicio de ejecución
    /// </summary>
    public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Fecha y hora de finalización
    /// </summary>
    public DateTime? FinishedAt { get; set; }

    // Navegación
    public RequestConfig RequestConfig { get; set; } = null!;
    public JsonTemplate? Template { get; set; }
    public ICollection<TestResult> Results { get; set; } = new List<TestResult>();
}
