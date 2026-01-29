namespace BAD.Storage.Entities;

/// <summary>
/// Plantilla JSON guardada para generar variaciones
/// </summary>
public class JsonTemplate
{
    public int Id { get; set; }
    
    /// <summary>
    /// Nombre descriptivo de la plantilla
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Descripción opcional de la plantilla
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Contenido JSON de la plantilla
    /// </summary>
    public string Content { get; set; } = string.Empty;
    
    /// <summary>
    /// Fecha de creación
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Fecha de última actualización
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navegación
    public ICollection<RequestConfig> RequestConfigs { get; set; } = new List<RequestConfig>();
    public ICollection<GeneratorSetting> GeneratorSettings { get; set; } = new List<GeneratorSetting>();
}
