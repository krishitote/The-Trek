// src/components/ExportButton.jsx
import React, { useState } from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  IconButton,
  useToast,
  Tooltip,
} from '@chakra-ui/react';
import { FaDownload, FaFileCsv, FaFilePdf } from 'react-icons/fa';
import { exportToCSV, exportToPDF, calculateStats } from '../utils/exportData';

export default function ExportButton({ 
  activities, 
  user, 
  variant = 'button', 
  size = 'sm', 
  colorScheme = 'green' 
}) {
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();

  const handleExport = async (format) => {
    if (!activities || activities.length === 0) {
      toast({
        title: 'No data to export',
        description: 'You need at least one activity to export',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      
      if (format === 'csv') {
        exportToCSV(activities, `the-trek-activities-${timestamp}.csv`);
        toast({
          title: 'CSV Downloaded!',
          description: `Exported ${activities.length} activities`,
          status: 'success',
          duration: 3000,
        });
      } else if (format === 'pdf') {
        const stats = calculateStats(activities);
        exportToPDF(activities, user, stats, `the-trek-report-${timestamp}.pdf`);
        toast({
          title: 'PDF Generated!',
          description: `Report with ${activities.length} activities`,
          status: 'success',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (variant === 'icon') {
    return (
      <Menu>
        <Tooltip label="Export Activities" placement="top">
          <MenuButton
            as={IconButton}
            icon={<FaDownload />}
            size={size}
            colorScheme={colorScheme}
            variant="ghost"
            isLoading={isExporting}
            aria-label="Export"
          />
        </Tooltip>
        <MenuList>
          <MenuItem icon={<FaFileCsv />} onClick={() => handleExport('csv')}>
            Export as CSV
          </MenuItem>
          <MenuItem icon={<FaFilePdf />} onClick={() => handleExport('pdf')}>
            Export as PDF
          </MenuItem>
        </MenuList>
      </Menu>
    );
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        leftIcon={<FaDownload />}
        size={size}
        colorScheme={colorScheme}
        isLoading={isExporting}
      >
        Export
      </MenuButton>
      <MenuList>
        <MenuItem icon={<FaFileCsv />} onClick={() => handleExport('csv')}>
          Export as CSV
        </MenuItem>
        <MenuItem icon={<FaFilePdf />} onClick={() => handleExport('pdf')}>
          Export as PDF
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
