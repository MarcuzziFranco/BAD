using System;

namespace BAD.Generator;

public class GeneratorDateTime : IGenerator
{
    public static DateTime RandomDatetime(DateTime min, DateTime max, string format)
    {
        int ranDays = (min - max).Days;
        Random random = new();
        int randomDays = random.Next(ranDays + 1);

        DateTime randomDate = min.AddDays(randomDays);
        string date = randomDate.ToString(format);
        return Convert.ToDateTime(date);
    }

    public static DateTime RandomDatetime(string dateMin, string dateMax, string format)
    {
        int ranDays = (Convert.ToDateTime(dateMax) - Convert.ToDateTime(dateMin)).Days;
        Random random = new();
        int randomDays = random.Next(ranDays + 1);

        DateTime randomDate = Convert.ToDateTime(dateMin).AddDays(randomDays);
        string date = randomDate.ToString(format);
        return Convert.ToDateTime(date);
    }
}
