using System.Text.RegularExpressions;

namespace BAD.Core.Generators;

public class GeneratorString : ISimpleGenerator<string>
{
    private static readonly Random _random = new();
    private static readonly string SeedLowerCase = "abcdefghijklmnopqrstuvwxyz";
    private static readonly string SeedUpperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static readonly string SeedAllCase = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static readonly string SeedAlphanumeric = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private static readonly string UuidPattern = @"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";

    public int DefaultLength { get; set; } = 10;
    public bool BeginUpperCase { get; set; } = true;
    public bool AllUpperCase { get; set; } = false;

    public string Generate()
    {
        return StringRandom(SeedAllCase, DefaultLength, BeginUpperCase, AllUpperCase);
    }

    private static string StringRandom(string seed, int length, bool beginUpperCase, bool allUpperCase)
    {
        char[] result = new char[length];
        for (int i = 0; i < length; i++)
        {
            result[i] = seed[_random.Next(seed.Length)];
        }
        string randomString = new string(result);

        if (allUpperCase)
        {
            randomString = randomString.ToUpper();
        }
        else if (beginUpperCase && !string.IsNullOrEmpty(randomString))
        {
            randomString = char.ToUpper(randomString[0]) + randomString.Substring(1);
        }

        return randomString;
    }

    public static string StringRandomLowerCase(int lengthMax, bool beginUpperCase, bool allUpperCase)
    {
        return StringRandom(SeedLowerCase, lengthMax, beginUpperCase, allUpperCase);
    }

    public static string StringRandomToUpperCase(int lengthMax, bool beginUpperCase, bool allUpperCase)
    {
        return StringRandom(SeedUpperCase, lengthMax, beginUpperCase, allUpperCase);
    }

    public static string StringRandomAllCase(int lengthMax, bool beginUpperCase, bool allUpperCase)
    {
        return StringRandom(SeedAllCase, lengthMax, beginUpperCase, allUpperCase);
    }

    public static string StringRandomAlphanumeric(int lengthMax, bool beginUpperCase, bool allUpperCase)
    {
        return StringRandom(SeedAlphanumeric, lengthMax, beginUpperCase, allUpperCase);
    }

    public static bool IsUUID(string value)
    {
        if (string.IsNullOrEmpty(value)) return false;
        return Regex.IsMatch(value, UuidPattern);
    }

    public static Guid StringRandomUUID()
    {
        return Guid.NewGuid();
    }
}
