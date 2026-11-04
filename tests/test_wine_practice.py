"""Regression checks of the captured live response; no live API calls in CI."""
import hashlib
import json
from pathlib import Path
import shutil
import pytest

pytest.importorskip('sklearn')
from experience_guided_code_agent.agent.executor import FileProjectAdapter
from experience_guided_code_agent.agent.planner import LLMPlanner
from experience_guided_code_agent.agent.workflow import run_agent
from scripts.prepare_wine import prepare


@pytest.fixture
def project(tmp_path):
    target = tmp_path / 'source'
    shutil.copytree('examples/wine_service', target, ignore=shutil.ignore_patterns('__pycache__'))
    manifest = prepare(tmp_path / 'preparation', target)
    assert manifest['train_rows'] == 124 and manifest['holdout_rows'] == 54
    assert not set(manifest['split']['train_source_rows']) & set(manifest['split']['holdout_source_rows'])
    config = {'template_dir':str(target), 'allowed_files':['service.py','config.json'],
              'validation_commands':[['{python}','validate.py']], 'timeout':60}
    return FileProjectAdapter(config, tmp_path / 'run')


def test_existing_service_does_not_pass_upgrade_acceptance(project):
    result = project.validate()
    assert result['passed'] is False
    checks = json.loads(result['checks'][0]['stdout'])['checks']
    assert any(c['name'] == 'actual_random_forest_runtime' and not c['passed'] for c in checks)
    assert any(c['name'] == 'legacy_fallback' and c['passed'] for c in checks)


def test_captured_live_response_replays_through_real_validator(project, tmp_path):
    evidence = json.loads(Path('docs/evidence/wine-live-run.json').read_text(encoding='utf-8'))['files']
    exchange = json.loads(evidence['attempts/01/model_exchange.json'])
    class RecordedResponse:
        def complete(self, messages, response_format=None):
            return exchange['response']
    class NoNetworkRetrieval:
        def search(self, *args, **kwargs):
            return []
    report = run_agent('Replay captured response to verify executor/validator compatibility',
                       NoNetworkRetrieval(), LLMPlanner(RecordedResponse()), project, tmp_path / 'run')
    assert report['status'] == 'success' and len(report['attempts']) == 1
    assert (tmp_path / 'run/delivery/changes.patch').exists()
    for name, item in report['delivery']['files'].items():
        assert hashlib.sha256((tmp_path / 'run/delivery' / name).read_bytes()).hexdigest() == item['sha256']


def test_validator_assets_are_checked_and_restored(project):
    project.checkpoint()
    file = project.workspace / 'validate.py'
    original = file.read_bytes()
    file.write_text('raise SystemExit(0)')
    assert project.validate()['passed'] is False
    assert project.rollback()['restored'] is True
    assert file.read_bytes() == original
