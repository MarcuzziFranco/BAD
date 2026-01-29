namespace BAD.Core.Generators;

public class GeneratorBoolean : ISimpleGenerator<bool>
{
    private static readonly Random _random = new();

    public bool Generate()
    {
        return _random.Next(0, 2) == 0;
    }

    public static bool RandomBoolean()
    {
        return new GeneratorBoolean().Generate();
    }
}
