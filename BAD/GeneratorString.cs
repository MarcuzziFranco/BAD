using BAD.Generator;
using System;

namespace BAD;

public class GeneratorString : IGenerator
{
    private static string seedLowerCase = "abcdefghijklmnopqrstuvwxyz";
    private static string seedToUpperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static string seedAllCase = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";


    private static string StringRandom(string seed,int lengthMax, bool beginUpperCase, bool allUpperCase)
    {
        Random random = new();

        char[] result = new char[lengthMax];
        for (int i = 0; i < lengthMax; i++)
        {
            result[i] = seed[random.Next(seed.Length)];
        }
        string randomString = new string(result);

        if (allUpperCase) randomString = randomString.ToUpper();

        if (beginUpperCase && !string.IsNullOrEmpty(randomString)) randomString = char.ToUpper(randomString[0]) + randomString.Substring(1);

        return randomString;
        
    }
    public static string StringRandomLowerCase(int lengthMax, bool beginUpperCase, bool allUpperCase)
    {
        return StringRandom(seedLowerCase, lengthMax, beginUpperCase, allUpperCase);
    }

    public static string StringRandomToUpperCase(int lengthMax, bool beginUpperCase, bool allUpperCase)
    {
        return StringRandom(seedToUpperCase, lengthMax, beginUpperCase, allUpperCase);
    }

    public static string StringRandomAllCase(int lengthMax, bool beginUpperCase, bool allUpperCase)
    {
        return StringRandom(seedAllCase, lengthMax, beginUpperCase, allUpperCase);
    }
}
