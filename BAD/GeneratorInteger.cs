using BAD.Generator;
using System;

namespace BAD;

public class GeneratorInteger : IGenerator
{
    public static int RandomInteger(int min,int max)
    {
        Random random = new();
        int value  = random.Next(min, max + 1);
        return value;
    }
}
