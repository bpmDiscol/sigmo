import { Flex, Image } from "antd";
import React from "react";

export default function ImagesRender({ images }) {
  function getLink(image) {
    return Meteor.absoluteUrl(
      `download?fileName=${encodeURIComponent(
        image.id
      )}.jpg&predio=${encodeURIComponent(image.predio)}`
    );
  }
  return (
    <Flex>
      {images.map((image) => {
        const link = getLink(image);
        return (
          <Image
            key={image.id}
            src={link}
            width={100}
            height={100}
            style={{ objectFit: "cover", padding: "8px" }}
          />
        );
      })}
    </Flex>
  );
}
