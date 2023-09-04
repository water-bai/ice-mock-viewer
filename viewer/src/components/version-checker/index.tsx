import { checkVersion } from '@/services';
import { Dialog } from '@ali/bp-materials';
import { Badge, Button, Message } from '@alifd/next';
import { useEffect, useState } from 'react';

function VersionChecker() {
  // @ts-ignore
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [curVersion, setCurVersion] = useState('');

  const handleCheckVersion = (showLoading = false) => {
    showLoading && Message.loading({ duration: 0, hasMask: true, content: '检查版本~' });
    checkVersion().then(({ currentVersion, version, betaVersion }) => {
      showLoading && Message.hide();
      if (![version, betaVersion].includes(currentVersion)) {
        if (showLoading) {
          Dialog.notice({
            title: '版本更新',
            content: (
              <div>
                <p>当前版本：<b>{currentVersion}</b></p>
                <p>最新正式版本：<b>{version}</b></p>
                <p>最新beta版本：<b>{betaVersion}</b></p>
              </div>
            ),
          });
        }
        setHasNewVersion(true);
      } else {
        Message.notice('当前已是最新版本！');
      }
      setCurVersion(currentVersion);
    });
  };
  useEffect(() => {
    setTimeout(() => {
      handleCheckVersion();
    }, 1000);
  }, []);
  return (
    <Badge
      content={hasNewVersion ? '新' : ''}
      style={{ backgroundColor: '#FC0E3D', color: '#FFFFFF' }}
    >
      <Button text onClick={() => handleCheckVersion(true)}>版本{hasNewVersion ? '更新' : `(v${curVersion})`}</Button>
    </Badge>
  );
}

export default VersionChecker;
