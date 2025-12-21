// src/components/ShareButton.jsx
import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  useToast,
  HStack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { FaShare, FaTwitter, FaFacebook, FaWhatsapp, FaLink } from 'react-icons/fa';
import {
  shareToTwitter,
  shareToFacebook,
  shareToWhatsApp,
  shareViaWebAPI,
  isWebShareSupported,
  openShareWindow,
  copyToClipboard,
  getAppShareUrl,
  generateActivityShareText,
  generateBadgeShareText,
} from '../utils/socialShare';

export default function ShareButton({ type, data, variant = 'icon', size = 'sm', colorScheme = 'blue' }) {
  const toast = useToast();
  const [isSharing, setIsSharing] = useState(false);

  // Generate share content based on type
  const getShareContent = () => {
    const appUrl = getAppShareUrl();
    
    if (type === 'activity') {
      const text = generateActivityShareText(data);
      return {
        title: 'Check out my activity on The Trek!',
        text: text,
        url: appUrl,
        twitterHashtags: ['TheTrek', 'Fitness', data.type],
      };
    } else if (type === 'badge') {
      const text = generateBadgeShareText(data);
      return {
        title: 'I earned a badge on The Trek!',
        text: text,
        url: appUrl,
        twitterHashtags: ['TheTrek', 'Fitness', 'Achievement'],
      };
    } else {
      return {
        title: 'The Trek - Track Your Fitness Journey',
        text: 'Join me on The Trek and track your fitness activities!',
        url: appUrl,
        twitterHashtags: ['TheTrek', 'Fitness'],
      };
    }
  };

  const handleShare = async (platform) => {
    setIsSharing(true);
    const content = getShareContent();

    try {
      if (platform === 'native' && isWebShareSupported()) {
        // Use Web Share API (mobile)
        await shareViaWebAPI({
          title: content.title,
          text: content.text,
          url: content.url,
        });
        toast({
          title: 'Shared successfully!',
          status: 'success',
          duration: 2000,
        });
      } else if (platform === 'twitter') {
        const url = shareToTwitter(content.text, content.url, content.twitterHashtags);
        openShareWindow(url, 'Twitter');
      } else if (platform === 'facebook') {
        const url = shareToFacebook(content.url);
        openShareWindow(url, 'Facebook');
      } else if (platform === 'whatsapp') {
        const text = `${content.text} ${content.url}`;
        const url = shareToWhatsApp(text);
        openShareWindow(url, 'WhatsApp');
      } else if (platform === 'copy') {
        const text = `${content.text}\n${content.url}`;
        await copyToClipboard(text);
        toast({
          title: 'Copied to clipboard!',
          status: 'success',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast({
        title: 'Share failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Icon button variant
  if (variant === 'icon') {
    return (
      <Menu>
        <Tooltip label="Share" placement="top">
          <MenuButton
            as={IconButton}
            icon={<FaShare />}
            size={size}
            colorScheme={colorScheme}
            variant="ghost"
            isLoading={isSharing}
            aria-label="Share"
          />
        </Tooltip>
        <MenuList>
          {isWebShareSupported() && (
            <MenuItem icon={<FaShare />} onClick={() => handleShare('native')}>
              Share...
            </MenuItem>
          )}
          <MenuItem icon={<FaTwitter color="#1DA1F2" />} onClick={() => handleShare('twitter')}>
            Share on Twitter
          </MenuItem>
          <MenuItem icon={<FaFacebook color="#4267B2" />} onClick={() => handleShare('facebook')}>
            Share on Facebook
          </MenuItem>
          <MenuItem icon={<FaWhatsapp color="#25D366" />} onClick={() => handleShare('whatsapp')}>
            Share on WhatsApp
          </MenuItem>
          <MenuItem icon={<FaLink />} onClick={() => handleShare('copy')}>
            Copy Link
          </MenuItem>
        </MenuList>
      </Menu>
    );
  }

  // Button variant
  return (
    <Menu>
      <MenuButton
        as={Button}
        leftIcon={<FaShare />}
        size={size}
        colorScheme={colorScheme}
        isLoading={isSharing}
      >
        Share
      </MenuButton>
      <MenuList>
        {isWebShareSupported() && (
          <MenuItem icon={<FaShare />} onClick={() => handleShare('native')}>
            Share...
          </MenuItem>
        )}
        <MenuItem icon={<FaTwitter color="#1DA1F2" />} onClick={() => handleShare('twitter')}>
          Share on Twitter
        </MenuItem>
        <MenuItem icon={<FaFacebook color="#4267B2" />} onClick={() => handleShare('facebook')}>
          Share on Facebook
        </MenuItem>
        <MenuItem icon={<FaWhatsapp color="#25D366" />} onClick={() => handleShare('whatsapp')}>
          Share on WhatsApp
        </MenuItem>
        <MenuItem icon={<FaLink />} onClick={() => handleShare('copy')}>
          Copy Link
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
