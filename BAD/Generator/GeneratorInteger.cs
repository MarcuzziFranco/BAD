using System;

namespace BAD.Generator;

public class GeneratorInteger : IGenerator
{
    public static int RandomInteger(int min, int max)
    {
        Random random = new();
        int value = random.Next(min, max + 1);
        return value;
    }
}
