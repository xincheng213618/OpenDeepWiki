using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KoalaWiki.Provider.MySQL.Migrations
{
    /// <inheritdoc />
    public partial class AddChatMessage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChatShareMessageItems",
                columns: table => new
                {
                    Id = table.Column<string>(type: "varchar(255)", nullable: false),
                    ChatShareMessageId = table.Column<string>(type: "varchar(255)", nullable: false),
                    WarehouseId = table.Column<string>(type: "varchar(255)", nullable: false),
                    Question = table.Column<string>(type: "longtext", nullable: false),
                    Answer = table.Column<string>(type: "longtext", nullable: false),
                    Think = table.Column<string>(type: "longtext", nullable: false),
                    PromptToken = table.Column<int>(type: "int", nullable: false),
                    CompletionToken = table.Column<int>(type: "int", nullable: false),
                    TotalTime = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatShareMessageItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChatShareMessages",
                columns: table => new
                {
                    Id = table.Column<string>(type: "varchar(255)", nullable: false),
                    WarehouseId = table.Column<string>(type: "varchar(255)", nullable: false),
                    IsDeep = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Title = table.Column<string>(type: "longtext", nullable: false),
                    Ip = table.Column<string>(type: "longtext", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatShareMessages", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatShareMessageItems_ChatShareMessageId",
                table: "ChatShareMessageItems",
                column: "ChatShareMessageId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatShareMessageItems_Question",
                table: "ChatShareMessageItems",
                column: "Question");

            migrationBuilder.CreateIndex(
                name: "IX_ChatShareMessages_WarehouseId",
                table: "ChatShareMessages",
                column: "WarehouseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatShareMessageItems");

            migrationBuilder.DropTable(
                name: "ChatShareMessages");
        }
    }
}
