import React from "react";
import WindowHeader from "../components/window-header";
import Exports from "../components/exports";
import {useTranslation} from "react-i18next";

const ExportsPage = () => {
  const {t} = useTranslation();
  return (
  <div className="cover-window">
    <WindowHeader title={t("Exports")} />
    <Exports />
    <style jsx global>{`
      :root {
        --thumbnail-overlay-color: rgba(0, 0, 0, 0.4);
        --row-hover-color: #f9f9f9;
        --background-color: #fff;
      }

      .dark {
        --thumbnail-overlay-color: rgba(0, 0, 0, 0.2);
        --row-hover-color: rgba(255, 255, 255, 0.1);
        --background-color: #222222;
      }
    `}</style>
  </div>
  );
};

export default ExportsPage;
