namespace BAD.Storage.Entities;

/// <summary>
/// Configuración de request HTTP guardada
/// </summary>
public class RequestConfig
{
    public int Id { get; set; }
    
    /// <summary>
    /// Nombre descriptivo de la configuración
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// URL del endpoint a testear
    /// </summary>
    public string Url { get; set; } = string.Empty;
    
    /// <summary>
    /// Método HTTP (GET, POST, PUT, DELETE, PATCH)
    /// </summary>
    public string Method { get; set; } = "POST";
    
    /// <summary>
    /// Headers HTTP en formato JSON
    /// </summary>
    public string? Headers { get; set; }
    
    /// <summary>
    /// Tipo de autenticación (None, Bearer, Basic)
    /// </summary>
    public string AuthType { get; set; } = "None";
    
    /// <summary>
    /// Valor de autenticación (token o credenciales)
    /// </summary>
    public string? AuthValue { get; set; }
    
    /// <summary>
    /// ID del template JSON asociado (opcional)
    /// </summary>
    public int? JsonTemplateId { get; set; }
    
    /// <summary>
    /// Fecha de creación
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navegación
    public JsonTemplate? JsonTemplate { get; set; }
    public ICollection<TestExecution> TestExecutions { get; set; } = new List<TestExecution>();
}
