namespace BAD.Generator;

public class GeneratorBoolean : IGenerator
{
    public static bool RandomBoolean()
    {
        Random random = new();
        return random.Next(0, 2) == 0;
    }
}
