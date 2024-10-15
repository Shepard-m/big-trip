const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/main.js", // Точка входа
  output: {
    filename: "bundle.[contenthash].js", // Имя бандла
    path: path.resolve(__dirname, "build"), // Директория для файлов сборки
    clean: true, // Удаляем предыдущую сборку перед созданием новой
    publicPath: "./",
  },
  devtool: "source-map", // Генерируем карту исходного кода
  plugins: [
    // Подключаем плагины
    new HtmlPlugin({
      template: "public/index.html",
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "public",
          globOptions: {
            ignore: ["**/index.html"],
          },
        },
      ],
    }),
  ],
  module: {
    rules: [
      // Добавляем лоадеры
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};
