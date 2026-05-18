using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BAD.Storage.Migrations
{
    /// <inheritdoc />
    public partial class AddApiCatalogOpenApiImport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ApiCatalogId",
                table: "RequestConfigs",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OpenApiOperationKey",
                table: "RequestConfigs",
                type: "TEXT",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ApiCatalogId",
                table: "JsonTemplates",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OpenApiOperationKey",
                table: "JsonTemplates",
                type: "TEXT",
                maxLength: 128,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ApiCatalogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    BaseUrl = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    SpecJson = table.Column<string>(type: "TEXT", nullable: false),
                    OpenApiVersion = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    InfoTitle = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    InfoVersion = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    OperationsJson = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApiCatalogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RequestConfigs_ApiCatalogId_OpenApiOperationKey",
                table: "RequestConfigs",
                columns: new[] { "ApiCatalogId", "OpenApiOperationKey" },
                unique: true,
                filter: "[ApiCatalogId] IS NOT NULL AND [OpenApiOperationKey] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_JsonTemplates_ApiCatalogId_OpenApiOperationKey",
                table: "JsonTemplates",
                columns: new[] { "ApiCatalogId", "OpenApiOperationKey" },
                unique: true,
                filter: "[ApiCatalogId] IS NOT NULL AND [OpenApiOperationKey] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ApiCatalogs_Name",
                table: "ApiCatalogs",
                column: "Name");

            migrationBuilder.AddForeignKey(
                name: "FK_JsonTemplates_ApiCatalogs_ApiCatalogId",
                table: "JsonTemplates",
                column: "ApiCatalogId",
                principalTable: "ApiCatalogs",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_RequestConfigs_ApiCatalogs_ApiCatalogId",
                table: "RequestConfigs",
                column: "ApiCatalogId",
                principalTable: "ApiCatalogs",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JsonTemplates_ApiCatalogs_ApiCatalogId",
                table: "JsonTemplates");

            migrationBuilder.DropForeignKey(
                name: "FK_RequestConfigs_ApiCatalogs_ApiCatalogId",
                table: "RequestConfigs");

            migrationBuilder.DropTable(
                name: "ApiCatalogs");

            migrationBuilder.DropIndex(
                name: "IX_RequestConfigs_ApiCatalogId_OpenApiOperationKey",
                table: "RequestConfigs");

            migrationBuilder.DropIndex(
                name: "IX_JsonTemplates_ApiCatalogId_OpenApiOperationKey",
                table: "JsonTemplates");

            migrationBuilder.DropColumn(
                name: "ApiCatalogId",
                table: "RequestConfigs");

            migrationBuilder.DropColumn(
                name: "OpenApiOperationKey",
                table: "RequestConfigs");

            migrationBuilder.DropColumn(
                name: "ApiCatalogId",
                table: "JsonTemplates");

            migrationBuilder.DropColumn(
                name: "OpenApiOperationKey",
                table: "JsonTemplates");
        }
    }
}
