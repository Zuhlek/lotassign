"use client";

import { Button } from '@mui/material';
import Link from 'next/link';

const TopBarTitle = () => {
  return (
    <Link href="/" passHref>
      <Button variant="contained" disableElevation size='large'>Baulog</Button>
    </Link>
  );
}

export default TopBarTitle;
