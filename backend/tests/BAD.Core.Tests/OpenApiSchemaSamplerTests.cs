using BAD.Core.OpenApi;
using Microsoft.OpenApi.Models;
using Microsoft.OpenApi.Readers;
using Newtonsoft.Json.Linq;

namespace BAD.Core.Tests;

public class OpenApiSchemaSamplerTests
{
    private const string MiniSpec = """
    {
      "openapi": "3.0.1",
      "info": { "title": "Test", "version": "v1" },
      "paths": {
        "/api/Orders": {
          "post": {
            "tags": ["Orders"],
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": { "$ref": "#/components/schemas/OrderRequest" }
                }
              }
            },
            "responses": { "201": { "description": "Created" } }
          }
        }
      },
      "components": {
        "schemas": {
          "OrderRequest": {
            "required": ["customerId", "items"],
            "type": "object",
            "properties": {
              "customerId": { "type": "string" },
              "items": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "productCode": { "type": "string" },
                    "quantity": { "type": "integer" }
                  }
                }
              }
            }
          }
        }
      }
    }
    """;

    [Fact]
    public void Sample_OrderRequest_HasFields()
    {
        var doc = OpenApiDocumentLoader.Parse(MiniSpec);
        var json = OpenApiSchemaSampler.SampleToJson(doc.Components!.Schemas["OrderRequest"], doc);
        Assert.Contains("customerId", json);
        var o = JObject.Parse(json);
        Assert.True(o["customerId"]?.Type == JTokenType.String);
        Assert.True(o["items"]?.Type == JTokenType.Array);
    }

    [Fact]
    public void Parse_MiniSpec_HasOrderRequestSchema()
    {
        var doc = OpenApiDocumentLoader.Parse(MiniSpec);
        Assert.True(doc.Components?.Schemas?.ContainsKey("OrderRequest") == true);
        var s = doc.Components!.Schemas["OrderRequest"];
        Assert.True(s.Properties?.ContainsKey("customerId") == true);
    }

    [Fact]
    public void Analyze_MiniSpec_FindsPostWithBody()
    {
        var result = OpenApiImportAnalyzer.Analyze(MiniSpec);
        Assert.Single(result.Operations);
        var op = result.Operations[0];
        Assert.Equal("POST /api/Orders", op.OperationKey);
        Assert.True(op.HasRequestBody, $"expected body; status={op.ImportStatus}");
        if (op.RequestSchemaRef != null)
            Assert.Equal("OrderRequest", op.RequestSchemaRef);
        Assert.False(string.IsNullOrEmpty(op.SampleJson));
        var json = JObject.Parse(op.SampleJson!);
        Assert.NotNull(json["customerId"]);
        Assert.NotNull(json["items"]);
    }

    [Fact]
    public void BuildOperationKey_IsStable()
    {
        Assert.Equal("GET /api/Contact/{id}", OpenApiOperationEnumerator.BuildOperationKey("get", "/api/Contact/{id}"));
    }
}
