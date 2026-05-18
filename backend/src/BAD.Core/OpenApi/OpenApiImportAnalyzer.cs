namespace BAD.Core.OpenApi;

public static class OpenApiImportAnalyzer
{
    public static OpenApiAnalyzeResult Analyze(string specJson, string? baseUrl = null)
    {
        var doc = OpenApiDocumentLoader.Parse(specJson);
        var result = OpenApiOperationEnumerator.Analyze(doc, baseUrl);
        return result;
    }
}
