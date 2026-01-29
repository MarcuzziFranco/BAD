namespace BAD.Storage.Entities;

/// <summary>
/// Configuración de generación guardada para una plantilla
/// </summary>
public class GeneratorSetting
{
    public int Id { get; set; }
    
    /// <summary>
    /// Nombre descriptivo de la configuración
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// ID del template JSON asociado
    /// </summary>
    public int JsonTemplateId { get; set; }
    
    /// <summary>
    /// Configuraciones por campo en formato JSON
    /// </summary>
    public string FieldConfigurations { get; set; } = "{}";
    
    /// <summary>
    /// Fecha de creación
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navegación
    public JsonTemplate JsonTemplate { get; set; } = null!;
}
