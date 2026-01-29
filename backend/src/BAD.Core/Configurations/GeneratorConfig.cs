namespace BAD.Core.Configurations;

/// <summary>
/// Configuración global para la generación de valores aleatorios
/// </summary>
public class GeneratorConfig
{
    // Rangos para integers
    public int IntegerMin { get; set; } = 1;
    public int IntegerMax { get; set; } = 100;

    // Rangos para floats
    public float FloatMin { get; set; } = 0.0f;
    public float FloatMax { get; set; } = 1000.0f;
    public int FloatDecimals { get; set; } = 2;

    // Configuración para strings
    public int StringLength { get; set; } = 10;
    public bool StringBeginUpperCase { get; set; } = true;

    // Rangos para fechas
    public string DateMin { get; set; } = "1990-01-01";
    public string DateMax { get; set; } = "2024-12-31";
    public string DateFormat { get; set; } = "O"; // ISO 8601
}
