import React, { useRef, useState } from "react";
// Import Swiper React components
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";

import screen1Svg from "../../../../resources/welcome_images/screen1-portal.svg";
import screen2Svg from "../../../../resources/welcome_images/screen2-heart.svg";
import screen3Svg from "../../../../resources/welcome_images/screen3-head.svg";
import screen4Svg from "../../../../resources/welcome_images/screen4-pool.svg";
import screen5Svg from "../../../../resources/welcome_images/screen5-primitives.svg";
import screen6Svg from "../../../../resources/welcome_images/screen6-heart2.svg";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

// import required modules
import { Pagination, Keyboard, Zoom } from "swiper/modules";
import { IonicSlides } from "@ionic/react";
import PageContainer from "../../shared/PageContainer/PageContainer";

const WelcomeTour = () => {
   const [swiper, setSwiper] = useState<SwiperClass>();

   const handleContinueClick = () => {
      const morePagesAvailable = swiper?.slideNext();
      if (!morePagesAvailable) {
         console.log("No more pages available");
      }
   };

   let commonStyles = { width: 200, height: 200 };

   return (
      <PageContainer>
         <Swiper
            pagination={{ clickable: true }}
            keyboard={true}
            zoom={true}
            modules={[Pagination, Keyboard, IonicSlides, Zoom]}
            onSwiper={setSwiper}
         >
            <SwiperSlide>
               <img src={screen1Svg} style={commonStyles} />
            </SwiperSlide>
            <SwiperSlide>
               <img src={screen2Svg} style={commonStyles} />
            </SwiperSlide>
            <SwiperSlide>
               <img src={screen3Svg} style={commonStyles} />
            </SwiperSlide>
            <SwiperSlide>
               <img src={screen4Svg} style={commonStyles} />
            </SwiperSlide>
            <SwiperSlide>
               <img src={screen5Svg} style={commonStyles} />
            </SwiperSlide>
            <SwiperSlide>
               <img src={screen6Svg} style={commonStyles} />
            </SwiperSlide>
         </Swiper>
         <button onClick={handleContinueClick}>Continue</button>
         <div className="">
            <p className="mt-10 border-l underline">Test.</p>
            <p>Test.</p>
         </div>
      </PageContainer>
   );
};

export default WelcomeTour;
