namespace BAD.Core.Generators;

public class GeneratorFloat : IGenerator<float>
{
    private static readonly Random _random = new();
    private int _decimalPlaces = 2;

    public int DecimalPlaces
    {
        get => _decimalPlaces;
        set => _decimalPlaces = value < 0 ? 0 : value;
    }

    public float Generate()
    {
        return Generate(0f, 100f);
    }

    public float Generate(float min, float max)
    {
        if (min >= max)
        {
            throw new ArgumentException("El valor mínimo debe ser menor que el máximo");
        }

        double valueRandom = (_random.NextDouble() * (max - min)) + min;
        return (float)Math.Round(valueRandom, _decimalPlaces);
    }

    public static float FloatRandom(float min, float max, int numberDecimal)
    {
        var generator = new GeneratorFloat { DecimalPlaces = numberDecimal };
        return generator.Generate(min, max);
    }
}
