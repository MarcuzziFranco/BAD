namespace BAD.Core.Generators;

public class GeneratorInteger : IGenerator<int>
{
    private static readonly Random _random = new();

    public int Generate()
    {
        return Generate(0, 100);
    }

    public int Generate(int min, int max)
    {
        return _random.Next(min, max + 1);
    }

    public static int RandomInteger(int min, int max)
    {
        return new GeneratorInteger().Generate(min, max);
    }
}
