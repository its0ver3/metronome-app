"""Render only 'and' in the established counting-voice style.

Needs numpy, scipy, soundfile, praat-parselmouth, and ffmpeg. The retained raw
John/Kristin takes are inputs. No number samples are ever rewritten.
"""
from pathlib import Path
import json
import subprocess
import tempfile
import numpy as np
import parselmouth
from parselmouth.praat import call
from scipy.ndimage import uniform_filter1d
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
TIERS = [('', .26), ('fast-', .18), ('faster-', .145), ('rapid-', .11), ('max-', .088)]

def active_rms(samples, rate):
    envelope = np.sqrt(np.maximum(0, uniform_filter1d(samples**2, round(rate*.02))))
    active = samples[envelope > envelope.max()*.15]
    return np.sqrt(np.mean(active**2))

def main():
    report = []
    for voice, target, low, high in [('male',95,60,210),('female',137,95,300)]:
        samples, rate = sf.read(ROOT/f'scripts/audio-sources/and-{voice}.wav')
        sound = parselmouth.Sound(samples,rate)
        pitch = sound.to_pitch_ac(time_step=.005,pitch_floor=low,pitch_ceiling=high).selected_array['frequency']
        median = np.median(pitch[pitch>0])
        # Gentle whole-word balancing: preserve every rise/fall inside the word.
        ratio = np.sqrt(target/median)
        if abs(12*np.log2(ratio)) > .1:
            parselmouth.praat.run('random_initializeWithSeedUnsafelyButPredictably (20260907)')
            manipulation = call(sound,'To Manipulation',.005,low,high)
            tier = call(manipulation,'Extract pitch tier')
            call(tier,'Multiply frequencies',0,sound.duration,float(ratio))
            call([tier,manipulation],'Replace pitch tier')
            samples = call(manipulation,'Get resynthesis (overlap-add)').values[0]
        folder = ROOT/f'public/audio/metronome/voice-{voice}'
        with tempfile.TemporaryDirectory(prefix='metronome-and-') as temporary:
            master = Path(temporary)/'source.wav'; sf.write(master,samples,rate,subtype='FLOAT')
            for index,(prefix,duration) in enumerate(TIERS):
                rendered = Path(temporary)/'rendered.wav'
                speed = len(samples)/rate/duration
                limit = 30/[110,155,190,250,300][index]-.002
                # atempo's output length is approximate. Re-render from the same master,
                # never trim a consonant off the end to fit the available eighth note.
                for attempt in range(5):
                    stages = max(1,int(np.ceil(np.log2(speed))))
                    tempo_filter = ','.join([f'atempo={speed**(1/stages):.12f}']*stages)
                    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(master),
                        '-af',tempo_filter,'-ar','48000','-ac','1','-c:a','pcm_f32le',str(rendered)],check=True)
                    output,out_rate = sf.read(rendered)
                    if len(output)/out_rate<=limit: break
                    speed *= (len(output)/out_rate)/limit*1.015
                assert len(output)/out_rate<=limit, 'And must finish before the next count'
                # Normalization matches the existing bank, without per-frame compression.
                levels=[]
                for number in range(1,17):
                    reference,reference_rate=sf.read(folder/f'{prefix}{number}.wav')
                    levels.append(active_rms(reference,reference_rate))
                gain=min(float(np.median(levels)/active_rms(output,out_rate)),.9/np.max(np.abs(output)))
                output*=gain
                fade_in=min(round(out_rate*.003),len(output)//4);fade_out=min(round(out_rate*.007),len(output)//4)
                output[:fade_in]*=np.linspace(0,1,fade_in);output[-fade_out:]*=np.linspace(1,0,fade_out)
                sf.write(folder/f'{prefix}and.wav',output,out_rate,subtype='PCM_16')
                report.append({'voice':voice,'tier':prefix or 'base','duration':len(output)/out_rate,'whole_word_pitch_ratio':float(ratio),'peak':float(np.max(np.abs(output)))})
    print(json.dumps(report,indent=2))

if __name__=='__main__':main()
