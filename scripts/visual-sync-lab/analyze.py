"""Recompute key timing checks from retained raw event/frame records."""
from pathlib import Path
import json

root = Path(__file__).resolve().parents[2] / 'docs/visual-sync-evidence'
for path in sorted(root.glob('*.json')):
    if 'pilot' in path.name:
        continue
    data = json.loads(path.read_text())
    s, beats, frames = data['summary'], data['beats'], data['renderedFrames']
    assert s['completed'] and not s['errors'] and not s['visibility'], path.name
    assert len(beats) == len(frames) == 69, path.name
    rate = s['sampleRate']
    difference = max(abs(frame / rate - beat['time']) * 1000 for beat, frame in zip(beats, frames))
    assert difference <= 1000 / rate, (path.name, difference)
    values = sorted(b['firstFrame'] - b['estimatedOutputAtFrame'] for b in beats[2:]
                    if b.get('estimatedOutputAtFrame') is not None)
    if '-after-' in path.name:
        visible = [b for b in beats[2:] if b.get('firstFrame') is not None]
        assert all(not b.get('visualLate') for b in visible), path.name
        assert all(b['firstFrameOpacity'] >= .999 for b in visible), path.name
        assert all(b['fullOpacityFrame'] == b['firstFrame'] for b in visible), path.name
        assert all(f['beat'] == 0 for f in data['flashes']), path.name
        assert len(data['flashes']) == sum(b['beat'] == 0 and not b.get('visualLate') for b in beats), path.name
        assert not values or max(values) <= 55, (path.name, values[-1])
    print(json.dumps({'run':path.stem, 'audioClicks':len(frames), 'beatEvents':len(beats),
                      'flashAnimations':len(data['flashes']), 'eventToSampleMaxMs':difference,
                      'orbitEstimateMedianMs':values[len(values)//2] if values else None,
                      'orbitEstimateMaxMs':values[-1] if values else None}))
