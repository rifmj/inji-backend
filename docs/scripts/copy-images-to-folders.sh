#!/bin/bash

# Путь к папке, в которой находятся изображения
IMAGE_FOLDER="/Users/rifatjumagulov/Downloads/Telegram Desktop/Новая папка 5"

# Перебираем каждый файл в папке
for file in "$IMAGE_FOLDER"/*; do
  # Если файл является изображением
  if [[ -f "$file" && "$file" =~ \.(jpg|jpeg|png|gif)$ ]]; then
    # Получаем имя файла без расширения
    filename=$(basename "$file" | cut -d. -f1)
    # Создаем папку с именем файла, если её еще нет
    mkdir -p "$IMAGE_FOLDER/$filename"
    # Перемещаем изображение в соответствующую папку
    mv "$file" "$IMAGE_FOLDER/$filename/$filename.${file##*.}"
  fi
done
