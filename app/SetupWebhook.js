// m-duka/app/SetupWebhook.js
import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";

const SetupWebhook = () => {
  const { shopData } = useContext(AuthContext);

  useEffect(() => {
    const registerWebhook = async () => {
      if (!shopData?.contact) {
        console.error("No shopId available");
        return;
      }
      try {
        const response = await fetch("https://vendai.digital/registerUrls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId: shopData.contact }),
        });
        const result = await response.json();
        console.log("Webhook Registration:", result);
      } catch (error) {
        console.error("Error registering webhook:", error);
      }
    };

    registerWebhook();
  }, [shopData]);

  return null; // Or a UI component if needed
};

export default SetupWebhook;