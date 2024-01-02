namespace BAD.Generator;

public class GenerateFloat: IGenerator
{
    public static float FloatRandom(float min, float max, int numberDecimal)
    {
        if (min >= max || numberDecimal < 0)
        {
            throw new ArgumentException("Invalid arguments");
        }

        Random random = new Random();
        double valueRandom = (random.NextDouble() * (max - min)) + min;
        float result = (float)Math.Round(valueRandom, numberDecimal);

        return result;
    }
}
