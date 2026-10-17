#!/usr/bin/env python3
"""Functional-only >10k historical-success probes; no before/speed claim.

Run after production implementation. Uses frozen benchmark observer unchanged.
"""
from __future__ import annotations
import json
import shutil
import sys
import tempfile
from pathlib import Path
import benchmark as bench


def probe(pattern: str) -> dict:
    with tempfile.TemporaryDirectory(prefix='issue47-historical-') as tmp:
        root=Path(tmp);workflow=json.loads((bench.REPO/'packages/core/test/fixtures/task-v2/native-multi.json').read_text())['workflow']
        bench.install(root,bench.REPO,workflow)
        for name in ('requirements.md','plan.md'):(root/name).write_text('Retained historical authority\n')
        paths=[]
        for index in range(10001):
            locator=f'candidate/p{index:05}.txt';path=root/locator;path.parent.mkdir(exist_ok=True)
            body=b'repeated\n'*128 if pattern=='repeated' else f'unique historical body {index:08}\n'.encode()*32
            if index==0:body=b'L'*(4*1024*1024)
            path.write_bytes(body);path.chmod(0o644);paths.append(locator)
        bench.git(root,'add','.');bench.git(root,'commit','-qm','historical actual candidate');commit=bench.git(root,'rev-parse','HEAD')
        bench.invoke(root,'task',['create','Historical candidate','--description','Functional historical-success batching probe','--slug','historical','--task-id','historical','--no-start','--base-branch','main'])
        task=next((root/'.trellis/tasks').glob('*-historical')).relative_to(root).as_posix()
        key={'task_id':'historical','lifecycle_generation':0,'delivery_id':'11111111-1111-4111-8111-111111111111'}
        scope={'authority':bench.ref(root,'requirements.md'),'anchors':['R1']}
        def apply(operation,role,fields,alias='apply'):
            op={'api_version':'1.0','operation':operation,'owner_role':role,'owner_id':workflow['owners'][role],
                'key':{k:v for k,v in key.items() if operation!='accept_scope' or k!='delivery_id'},**fields}
            (root/'operation.json').write_text(json.dumps(op))
            out,metrics=bench.invoke(root,'delivery',[alias,'--task',task,'--input','operation.json'])
            return json.loads(out),metrics
        apply('accept_scope','task_scope',{'authority':scope['authority']})
        apply('create_delivery','creation',{'scope_ref':scope,'profile':'local_commit'})
        plan=bench.ref(root,'plan.md')
        apply('record_gate','planning',{'expected_phase':'planning','result':{'result_id':'historical-planning','owner_role':'planning','owner_id':workflow['owners']['planning'],'outcome':'accepted','scope_ref':scope,'plan_ref':plan,'candidate':None,'predecessor_result_id':None,'obligations':[],'evidence':[plan]}})
        out,_=bench.invoke(root,'delivery',['candidate','--kind','git','--paths',*paths])
        candidate={'kind':'git','content_ref':json.loads(out)['content_ref'],'paths':paths,'head_ref':commit,'base_ref':None}
        # A real later HEAD, separately changed index, and changed worktree must
        # not replace the expressly retained historical commit facts.
        (root/'later-marker').write_text('later HEAD\n');bench.git(root,'add','later-marker');bench.git(root,'commit','-qm','later HEAD')
        (root/paths[1]).write_text('different staged content\n');bench.git(root,'add',paths[1])
        (root/paths[2]).write_text('different unstaged content\n')
        fields={'expected_phase':'implementing','historical_success':True,'result':{'result_id':'historical-delivered','owner_id':workflow['owners']['delivery'],'evidence':[plan],'candidate':candidate,'profile':'local_commit','commit':commit}}
        result,metrics=apply('record_delivery','delivery',fields,'record-delivery')
        assert result['changed'] is True and result['phase']=='delivered'
        before=(root/task/'task.json').read_bytes()
        retry,retry_metrics=apply('record_delivery','delivery',fields,'record-delivery')
        assert retry['changed'] is False and (root/task/'task.json').read_bytes()==before
        expected_unique=2 if pattern=='repeated' else 10001
        assert metrics['requested_object_reads']==expected_unique,metrics
        assert metrics['unique_git_blob_contents_read']==expected_unique,metrics
        assert metrics['git_commands'].get('show',0)==0 and metrics['git_commands'].get('ls-tree',0)==1,metrics
        assert 1<=metrics['git_commands'].get('cat-file',0)<=1+(expected_unique+127)//128,metrics
        assert metrics['git_max_object_bytes']==4*1024*1024,metrics
        assert metrics['python_peak_rss_bytes']<=256*1024*1024 and metrics['git_peak_rss_bytes']<=64*1024*1024,metrics
        return {'pattern':pattern,'paths':len(paths),'expected_unique_blobs':expected_unique,'historical_head_differs':True,'index_and_worktree_differ':True,'record_delivery':metrics,'retry':retry_metrics,'retry_changed':False,'task_bytes_unchanged_on_retry':True,'claim':'functional process-count/resource evidence only; not a before/after performance claim'}

if __name__=='__main__':
    output=Path(sys.argv[1]);results=[]
    for pattern in ('repeated','unique'):
        results.append(probe(pattern));output.write_text(json.dumps({'probes':results},indent=2)+'\n');print(pattern,'passed',flush=True)
