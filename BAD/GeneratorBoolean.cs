﻿using BAD.Generator;

namespace BAD;

public class GeneratorBoolean: IGenerator
{
    public static bool RandomBoolean()
    {
        Random random = new();
        return random.Next(0, 2) == 0;
    }
}
