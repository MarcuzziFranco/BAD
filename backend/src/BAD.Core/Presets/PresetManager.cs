using BAD.Core.Configurations;
using BAD.Core.Generators;
using BAD.Core.Presets.Mutations;
using Newtonsoft.Json.Linq;

namespace BAD.Core.Presets;

/// <summary>
/// Gestor de presets de mutación
/// </summary>
public class PresetManager
{
    private readonly List<IPreset> _presets;

    public PresetManager()
    {
        _presets = new List<IPreset>
        {
            // Básicos
            new OriginalPreset(),
            new RandomPreset(),
            new AllNullPreset(),
            
            // Testing/QA
            new BoundaryPreset(),
            new EmptyPreset(),
            new ExtremePreset(),
            
            // Seguridad
            new InjectionPreset(),
            new InvalidTypesPreset()
        };
    }

    /// <summary>
    /// Obtiene todos los presets disponibles
    /// </summary>
    public IReadOnlyList<IPreset> GetAllPresets() => _presets.AsReadOnly();

    /// <summary>
    /// Obtiene presets por categoría
    /// </summary>
    public IEnumerable<IPreset> GetPresetsByCategory(PresetCategory category)
    {
        return _presets.Where(p => p.Category == category);
    }

    /// <summary>
    /// Obtiene un preset por nombre
    /// </summary>
    public IPreset? GetPresetByName(string name)
    {
        return _presets.FirstOrDefault(p => p.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Aplica un preset al GeneratorJson
    /// </summary>
    /// <param name="preset">Preset a aplicar</param>
    /// <param name="jsonTemplate">JSON template base</param>
    /// <param name="generator">Generador al que aplicar el preset</param>
    public void ApplyPreset(IPreset preset, JObject jsonTemplate, GeneratorJson generator)
    {
        generator.ClearDefaultValues();

        var configs = preset.GenerateConfig(jsonTemplate);
        
        foreach (var kvp in configs)
        {
            generator.AddDefaultValue(kvp.Key, kvp.Value);
        }
    }

    /// <summary>
    /// Aplica un preset por nombre
    /// </summary>
    public bool ApplyPresetByName(string name, JObject jsonTemplate, GeneratorJson generator)
    {
        var preset = GetPresetByName(name);
        if (preset == null) return false;

        ApplyPreset(preset, jsonTemplate, generator);
        return true;
    }

    /// <summary>
    /// Obtiene las opciones de menú formateadas por categoría
    /// </summary>
    public List<(string Category, List<IPreset> Presets)> GetPresetsGroupedByCategory()
    {
        return _presets
            .GroupBy(p => p.Category)
            .OrderBy(g => g.Key)
            .Select(g => (GetCategoryName(g.Key), g.ToList()))
            .ToList();
    }

    private static string GetCategoryName(PresetCategory category) => category switch
    {
        PresetCategory.Basic => "Básicos",
        PresetCategory.Testing => "Testing/QA",
        PresetCategory.Security => "Seguridad",
        _ => category.ToString()
    };
}
