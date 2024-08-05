"use client";

import { Button } from '@mui/material';
import Link from 'next/link';

interface TopBarTitleProps {
  title: string;
}

const TopBarTitle = ({title}: TopBarTitleProps) => {
  return (
    <Link href="/" passHref>
      <Button variant="contained" disableElevation size='large'>{title}</Button>
    </Link>
  );
}

export default TopBarTitle;
