// src/components/InstallPWA.jsx
import React, { useState, useEffect } from 'react';
import {
  Button,
  useToast,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { FaDownload } from 'react-icons/fa';
import { setupInstallPrompt, showInstallPrompt, isPWA } from '../utils/pwa';

export default function InstallPWA({ variant = 'button', size = 'md', colorScheme = 'green' }) {
  const [canInstall, setCanInstall] = useState(false);
  const [installing, setInstalling] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Don't show if already installed
    if (isPWA()) {
      return;
    }

    setupInstallPrompt((installable) => {
      setCanInstall(installable);
    });
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const { outcome } = await showInstallPrompt();
      
      if (outcome === 'accepted') {
        toast({
          title: 'App Installing!',
          description: 'The Trek is being added to your home screen',
          status: 'success',
          duration: 3000,
        });
        setCanInstall(false);
      } else if (outcome === 'dismissed') {
        toast({
          title: 'Install Cancelled',
          description: 'You can install later from the menu',
          status: 'info',
          duration: 2000,
        });
      } else {
        toast({
          title: 'Install Not Available',
          description: 'Try adding to home screen from your browser menu',
          status: 'warning',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Install error:', error);
      toast({
        title: 'Install Failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setInstalling(false);
    }
  };

  // Don't render if can't install or already installed
  if (!canInstall || isPWA()) {
    return null;
  }

  if (variant === 'icon') {
    return (
      <Tooltip label="Install App" placement="bottom">
        <IconButton
          icon={<FaDownload />}
          onClick={handleInstall}
          isLoading={installing}
          colorScheme={colorScheme}
          size={size}
          variant="ghost"
          aria-label="Install App"
        />
      </Tooltip>
    );
  }

  return (
    <Button
      leftIcon={<FaDownload />}
      onClick={handleInstall}
      isLoading={installing}
      colorScheme={colorScheme}
      size={size}
    >
      Install App
    </Button>
  );
}
