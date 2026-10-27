import React, { useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";
import { apiSetLeaderboardChoice } from "../services/api";

// Shown once to users who have never answered; they must pick before continuing.
export default function LeaderboardChoiceModal() {
  const { user, session, setUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  if (!user || user.leaderboard_choice_made !== false) return null;

  const choose = async (show) => {
    setSaving(true);
    try {
      const result = await apiSetLeaderboardChoice(session.accessToken, user.id, show);
      const updated = { ...user, ...result };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
    } catch (err) {
      console.error("Saving leaderboard choice failed:", err);
      toast({
        title: "Could not save your choice",
        description: "Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={() => {}} isCentered closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalOverlay />
      <ModalContent mx={4}>
        <ModalHeader>🏆 Join the Top Champions?</ModalHeader>
        <ModalBody>
          <Text>
            The home page shows the top 10 athletes. If you join, it shows your username, your
            activity totals, and which gender board you rank on. Your email, profile details and
            individual activities are never shown.
          </Text>
          <Text mt={3} fontSize="sm" color="gray.600">
            You can change this any time in your Profile.
          </Text>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="outline" onClick={() => choose(false)} isDisabled={saving}>
            Keep me private
          </Button>
          <Button colorScheme="green" onClick={() => choose(true)} isLoading={saving}>
            Show me on the leaderboard
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
