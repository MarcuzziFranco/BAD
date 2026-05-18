namespace BAD.Storage.Entities;

/// <summary>
/// Configuración de generación guardada para una plantilla
/// </summary>
public class GeneratorSetting
{
    public int Id { get; set; }
    
    /// <summary>
    /// Nombre descriptivo de la configuración (único por template)
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Descripción opcional
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// ID del template JSON asociado
    /// </summary>
    public int JsonTemplateId { get; set; }
    
    /// <summary>
    /// Configuraciones por campo en formato JSON (array de FieldConfig)
    /// </summary>
    public string FieldConfigurations { get; set; } = "[]";
    
    /// <summary>
    /// Fecha de creación
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Fecha de última actualización
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navegación
    public JsonTemplate JsonTemplate { get; set; } = null!;
}
