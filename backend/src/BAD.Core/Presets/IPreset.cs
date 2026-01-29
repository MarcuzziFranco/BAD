using BAD.Core.Configurations;
using Newtonsoft.Json.Linq;

namespace BAD.Core.Presets;

/// <summary>
/// Interface para definir presets de mutación
/// </summary>
public interface IPreset
{
    /// <summary>
    /// Nombre del preset
    /// </summary>
    string Name { get; }

    /// <summary>
    /// Descripción del preset
    /// </summary>
    string Description { get; }

    /// <summary>
    /// Categoría del preset (Básico, Testing, Seguridad)
    /// </summary>
    PresetCategory Category { get; }

    /// <summary>
    /// Genera la configuración de mutación para todos los campos del JSON
    /// </summary>
    /// <param name="jsonTemplate">JSON template a mutar</param>
    /// <returns>Diccionario con configuraciones por campo</returns>
    Dictionary<string, DefaultValueConfig> GenerateConfig(JObject jsonTemplate);
}

/// <summary>
/// Categorías de presets
/// </summary>
public enum PresetCategory
{
    /// <summary>
    /// Presets básicos (original, aleatorio, null)
    /// </summary>
    Basic,

    /// <summary>
    /// Presets para testing/QA (boundary, empty, extreme)
    /// </summary>
    Testing,

    /// <summary>
    /// Presets de seguridad (injection, invalid types)
    /// </summary>
    Security
}
