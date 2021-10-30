import React, { FC, ReactChild, ReactNode, useEffect, useState } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { CarouselStyled } from "./styles.ImagesCarousel";

interface PropsImagesCarousel {
   children: ReactChild[] & ReactNode;
}

const ImagesCarousel: FC<PropsImagesCarousel> = ({ children }) => {
   const [selectedItem, setSelectedItem] = useState(0);

   console.log("RENDER");
   const handleItemClick = (index: number) => {
      setSelectedItem(index + 1);
   };

   useEffect(() => {
      if (selectedItem !== 0) {
         setSelectedItem(0);
      }
   }, [children]);

   return (
      <CarouselStyled
         infiniteLoop
         showThumbs={false}
         onClickItem={handleItemClick}
         selectedItem={selectedItem}
         transitionTime={100}
      >
         {children}
      </CarouselStyled>
   );
};

export default ImagesCarousel;